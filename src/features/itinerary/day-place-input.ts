export type DayPlaceDetails = {
  endTime: string | null;
  notes: string | null;
  startTime: string | null;
};

type Result = { data: DayPlaceDetails; success: true } | { success: false };

function optional(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || null;
}

export function parseDayPlaceDetails(formData: FormData): Result {
  const startTime = optional(formData.get("startTime"));
  const endTime = optional(formData.get("endTime"));
  const notes = optional(formData.get("notes"));
  if ((startTime !== null && !isValidTimeOnly(startTime)) || (endTime !== null && !isValidTimeOnly(endTime)) || (notes?.length ?? 0) > 1200) {
    return { success: false };
  }
  return { data: { endTime, notes, startTime }, success: true };
}
import { isValidTimeOnly } from "@/lib/date-time";
