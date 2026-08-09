const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function dateOnlyParts(value: string) {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    Number.isNaN(date.valueOf()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return { day: Number(day), month: Number(month), year: Number(year) };
}

/** Validates a canonical calendar date without converting it through a timezone. */
export function isValidDateOnly(value: string | null | undefined) {
  return typeof value === "string" && dateOnlyParts(value) !== null;
}

/** Converts a canonical date-only value into a local calendar Date for a calendar UI. */
export function dateOnlyToCalendarDate(value: string | null | undefined) {
  if (!value) return null;
  const parts = dateOnlyParts(value);
  return parts ? new Date(parts.year, parts.month - 1, parts.day, 12) : null;
}

/** Serializes a calendar UI Date back to the canonical date-only contract. */
export function calendarDateToDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Validates a canonical 24-hour time without adding date or timezone semantics. */
export function isValidTimeOnly(value: string | null | undefined) {
  return typeof value === "string" && TIME_ONLY_PATTERN.test(value);
}

/** Validates the local, timezone-free datetime contract used before server conversion. */
export function isValidDateTimeLocal(value: string | null | undefined) {
  if (typeof value !== "string") return false;
  const [date, time, ...rest] = value.split("T");
  return rest.length === 0 && isValidDateOnly(date) && isValidTimeOnly(time);
}

function dateOnlyValue(value: string) {
  const parts = dateOnlyParts(value);
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)) : null;
}

/** Formats a calendar date without converting it through the runtime timezone. */
export function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const date = dateOnlyValue(value);
  return date ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", timeZone: "UTC", year: "numeric" }).format(date) : value;
}

export function formatDateOnlyShort(value: string | null | undefined) {
  if (!value) return "—";
  const date = dateOnlyValue(value);
  return date ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", timeZone: "UTC", year: "numeric" }).format(date) : value;
}

export function formatDateOnlyLong(value: string | null | undefined) {
  if (!value) return "—";
  const date = dateOnlyValue(value);
  return date ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", timeZone: "UTC", year: "numeric", weekday: "long" }).format(date) : value;
}

/** Formats an instant in the trip's explicit IANA timezone. */
export function formatTripDateTime(value: string | null | undefined, timeZone: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
}

export function formatTripTime(value: string | null | undefined, timeZone: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
}

export function formatTripDate(value: string | null | undefined, timeZone: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", timeZone, year: "numeric" }).format(date);
}

/** Converts a stored instant back to the canonical local datetime contract for a trip. */
export function timestampToDateTimeLocal(value: string | null | undefined, timeZone: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "2-digit", timeZone, year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const hour = part("hour") === "24" ? "00" : part("hour");
  return `${part("year")}-${part("month")}-${part("day")}T${hour}:${part("minute")}`;
}
