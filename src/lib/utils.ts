import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDate, formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date();

  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) { // if the date is less than 24 hours ago, show the relative time (e.g. "5 minutes ago", "2 hours ago", etc.)
    return formatDistanceToNowStrict(from, { addSuffix: true });
  } else {
    //if the date is more than 24 hours ago, there are 2 cases, one is if it is the same year as the current date, then show the date in "MMM d" format if it's the same year, otherwise show it in "MMM d, yyyy" format. For example, if the date is "2023-08-15" and the current date is "2023-08-20", it will show "Aug 15". If the date is "2022-12-25" and the current date is "2023-08-20", it will show "Dec 25, 2022".
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDate(from, "MMM d");
    } else {
      return formatDate(from, "MMM d, yyyy");
    }
  }
}
         


export function formatNumber(n:number):string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
 


//slugify function to clean up usernames, we convert to lowercase, remove spaces and replace then with -, and then remove all non-alphaNumerical characters
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}