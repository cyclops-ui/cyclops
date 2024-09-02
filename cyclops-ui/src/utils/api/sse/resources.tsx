import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

class RetriableError extends Error {}
class FatalError extends Error {}

export function resourceStream(
  group: string,
  version: string,
  kind: string,
  name: string,
  namespace: string,
  setResource: (r: any) => void,
) {
  fetchEventSource(`/api/stream/resources`, {
    method: "POST",
    body: JSON.stringify({
      group: group,
      version: version,
      kind: kind,
      name: name,
      namespace: namespace,
    }),
    onmessage(ev) {
      setResource(JSON.parse(ev.data));
    },
    async onopen(response) {
      if (
        response.ok &&
        response.headers.get("content-type") === EventStreamContentType
      ) {
        return; // everything's good
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
        throw err; // rethrow to stop the operation
      }

      return 5000;
    },
  }).catch((r) => console.error(r));
}
