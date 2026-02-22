import { parse, setHours, setMinutes, setSeconds } from "date-fns";

/**
 * Parses a time string like "9:00 AM" or "2:30 PM" and returns hours (0-23) and minutes (0-59).
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return { hours: 0, minutes: 0 };
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

/**
 * Converts a local date string (YYYY-MM-DD) and time string (e.g. "9:00 AM") into an
 * ISO 8601 string in UTC (Greenwich). The date/time is interpreted in the user's local
 * timezone, then converted to UTC for the API.
 */
export function toBookingDateTimeUTC(dateStr: string, timeStr: string): string {
  const dateOnly = dateStr.trim();
  if (!dateOnly) return nowAsUTC();

  let date: Date;
  try {
    date = parse(dateOnly, "yyyy-MM-dd", new Date());
  } catch {
    return nowAsUTC();
  }

  const { hours, minutes } = parseTimeString(timeStr);
  const withTime = setSeconds(setMinutes(setHours(date, hours), minutes), 0);
  return withTime.toISOString();
}

/**
 * Returns the current moment as ISO 8601 in UTC (Greenwich).
 */
export function nowAsUTC(): string {
  return new Date().toISOString();
}
