import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

class RetriableError extends Error {}
class FatalError extends Error {}

export function logStream(
  name: string,
  namespace: string,
  container: string,
  setLog: (log: string) => void,
  setError: (err: Error) => void,
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
      "/logs",
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
    },
  ).catch((r) => {
    setError(r);
  });
}