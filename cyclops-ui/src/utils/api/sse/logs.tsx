import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

class RetriableError extends Error {}
class FatalError extends Error {}

export function logStream(
  namespace: string,
  name: string,
  container: string,
  setLog: (log: string, isReset?: boolean) => void,
  setError: (err: Error, isReset?: boolean) => void,
  signalController: AbortController,
  logStreamImpl?: (
    name: string,
    namespace: string,
    container: string,
    setLog: (log: string, isReset?: boolean) => void,
    setError: (err: Error, isReset?: boolean) => void,
    signalController: AbortController,
  ) => void,
) {
  if (logStreamImpl === undefined || logStreamImpl === null) {
    defaultLogStream(
      name,
      namespace,
      container,
      setLog,
      setError,
      signalController,
    );
    return;
  }

  logStreamImpl(namespace, name, container, setLog, setError, signalController);
}

export function defaultLogStream(
  name: string,
  namespace: string,
  container: string,
  setLog: (log: string, isReset?: boolean) => void,
  setError: (err: Error, isReset?: boolean) => void,
  signalController: AbortController,
) {
  fetchEventSource(
    "/api/resources/pods" +
      "/" +
      namespace +
      "/" +
      name +
      "/" +
      container +
      "/logs/stream",
    {
      signal: signalController.signal,
      method: "GET",
      onmessage(ev) {
        setLog(ev.data);
      },
      async onopen(response) {
        if (
          response.ok &&
          response.headers.get("content-type") === EventStreamContentType
        ) {
          // here we have success - we need to remove the error and reset the logs
          setError(new Error(), true);
          setLog("", true);
          return;
        } else if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw new FatalError();
        } else {
          throw new RetriableError();
        }
      },
      onclose() {
        throw new RetriableError();
      },
      onerror: (err) => {
        if (err instanceof FatalError) {
          setError(err);
          throw err; // rethrow to stop the operation
        }

        setError(err);
        return 5000;
      },
      openWhenHidden: true,
    },
  ).catch((r) => {
    setError(r);
  });
}
