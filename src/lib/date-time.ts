const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function dateOnlyValue(value: string) {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.valueOf()) ? null : date;
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
