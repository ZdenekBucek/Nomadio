import type { ItineraryDayStatus } from "@/lib/supabase/database.types";

export type ItineraryDayInput = {
  city: string | null;
  date: string | null;
  isReserve: boolean;
  name: string;
  status: ItineraryDayStatus;
};

type Result = { data: ItineraryDayInput; success: true } | { error: "invalid"; success: false };

function optional(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || null;
}

function isIsoDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function parseItineraryDay(formData: FormData): Result {
  const name = formData.get("name")?.toString().trim() ?? "";
  const city = optional(formData.get("city"));
  const date = optional(formData.get("date"));
  const status = formData.get("status")?.toString() ?? "";
  if (name.length < 1 || name.length > 120 || (city?.length ?? 0) > 120 || !isIsoDate(date) || !["plan", "confirmed", "completed"].includes(status)) {
    return { error: "invalid", success: false };
  }
  return { data: { city, date, isReserve: formData.get("isReserve") === "on", name, status: status as ItineraryDayStatus }, success: true };
}
