/**
 * Internationalized formatting utilities wrapping standard Intl APIs.
 * Supports dynamic locale and distance units (km / mi).
 */

export type DistanceUnit = "km" | "mi";

/**
 * Format a numeric value with locale-aware number formatting.
 */
export function formatNumber(
  value: number,
  locale: string = "en-US",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a decimal fraction (e.g. 0.85) as a locale-aware percentage (85%).
 */
export function formatPercent(
  value: number,
  locale: string = "en-US",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

/**
 * Format distance in meters to locale-aware km or miles.
 */
export function formatDistance(
  meters: number,
  unit: DistanceUnit = "km",
  locale: string = "en-US"
): string {
  if (unit === "mi") {
    const miles = meters / 1609.344;
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: miles < 10 ? 1 : 0,
    }).format(miles);
    return `${formatted} mi`;
  }

  const kilometers = meters / 1000;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: kilometers < 10 ? 1 : 0,
  }).format(kilometers);
  return `${formatted} km`;
}

/**
 * Format duration in seconds into human-readable hours and minutes.
 */
export function formatDuration(seconds: number, locale: string = "en-US"): string {
  const rounded = Math.round(Math.max(0, seconds));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Format date and time for a specific IANA time zone.
 */
export function formatDateTime(
  date: Date | string,
  locale: string = "en-US",
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    ...options,
  };
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

/**
 * Format time only (e.g. 14:30 or 2:30 PM).
 */
export function formatTime(
  date: Date | string,
  locale: string = "en-US",
  timeZone?: string
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(d);
}

/**
 * Format date only (e.g. Oct 10, 2026).
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US",
  timeZone?: string
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(d);
}

/**
 * Format relative time using Intl.RelativeTimeFormat.
 */
export function formatRelativeTime(
  date: Date | string,
  baseDate: Date = new Date(),
  locale: string = "en-US"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSeconds = Math.round((d.getTime() - baseDate.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, "second");
  }
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}
