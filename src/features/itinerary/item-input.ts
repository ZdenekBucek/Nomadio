import type { ItineraryItemType } from "@/lib/supabase/database.types";
import { isValidTimeOnly } from "@/lib/date-time";

export type ItineraryItemInput = { endTime: string | null; notes: string | null; placeId: string | null; startTime: string | null; title: string; type: ItineraryItemType };
type Result = { data: ItineraryItemInput; success: true } | { error: "invalid"; success: false };

function optional(value: FormDataEntryValue | null) { const text = value?.toString().trim(); return text || null; }
export function parseItineraryItem(formData: FormData): Result {
  const title = formData.get("title")?.toString().trim() ?? "";
  const type = formData.get("type")?.toString() ?? "";
  const startTime = optional(formData.get("startTime"));
  const endTime = optional(formData.get("endTime"));
  const notes = optional(formData.get("notes"));
  const placeId = optional(formData.get("placeId"));
  if (title.length < 1 || title.length > 160 || !["activity", "transport", "note"].includes(type) || (startTime !== null && !isValidTimeOnly(startTime)) || (endTime !== null && !isValidTimeOnly(endTime)) || (notes?.length ?? 0) > 1200 || (placeId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(placeId))) return { error: "invalid", success: false };
  return { data: { endTime, notes, placeId, startTime, title, type: type as ItineraryItemType }, success: true };
}
