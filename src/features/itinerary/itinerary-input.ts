import type { ItineraryDayStatus } from "@/lib/supabase/database.types";
import { isValidDateOnly } from "@/lib/date-time";

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

export function parseItineraryDay(formData: FormData): Result {
  const name = formData.get("name")?.toString().trim() ?? "";
  const city = optional(formData.get("city"));
  const date = optional(formData.get("date"));
  const status = formData.get("status")?.toString() ?? "";
  if (name.length < 1 || name.length > 120 || (city?.length ?? 0) > 120 || (date !== null && !isValidDateOnly(date)) || !["plan", "confirmed", "completed"].includes(status)) {
    return { error: "invalid", success: false };
  }
  return { data: { city, date, isReserve: formData.get("isReserve") === "on", name, status: status as ItineraryDayStatus }, success: true };
}
