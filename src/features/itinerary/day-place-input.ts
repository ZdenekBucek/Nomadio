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

function isTime(value: string | null) {
  return value === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseDayPlaceDetails(formData: FormData): Result {
  const startTime = optional(formData.get("startTime"));
  const endTime = optional(formData.get("endTime"));
  const notes = optional(formData.get("notes"));
  if (!isTime(startTime) || !isTime(endTime) || (notes?.length ?? 0) > 1200) {
    return { success: false };
  }
  return { data: { endTime, notes, startTime }, success: true };
}
