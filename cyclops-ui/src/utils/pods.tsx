import {formatDistanceToNow} from "date-fns";

function formatPodAge(podAge: string): string {
    const parsedDate = new Date(podAge);
    return formatDistanceToNow(parsedDate, { addSuffix: true });
}
