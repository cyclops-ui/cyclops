import { formatDistanceToNow } from "date-fns";

export const formatReplicaSetAge = (creationTimestamp: string) => {
  if (creationTimestamp === null || creationTimestamp === "") {
    return "";
  }

  const parsedDate = new Date(creationTimestamp);
  return formatDistanceToNow(parsedDate, {
    addSuffix: true,
  });
};
