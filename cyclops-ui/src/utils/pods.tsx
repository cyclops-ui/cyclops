import { formatDistanceToNow } from "date-fns";

export function formatPodAge(podAge: string): string {
  if (podAge === null || podAge === "") {
    return "";
  }

  const parsedDate = new Date(podAge);
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}
