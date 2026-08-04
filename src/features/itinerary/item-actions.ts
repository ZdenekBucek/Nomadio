"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseItineraryItem } from "./item-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function itemPath(tripId: string, dayId: string, status: string) { return uuidPattern.test(tripId) && uuidPattern.test(dayId) ? `/app/trips/${tripId}/itinerary/${dayId}?item=${status}` : "/app/trips"; }
async function client(tripId: string, dayId: string) { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); if (!data.user) redirect(`/login?next=/app/trips/${tripId}/itinerary/${dayId}`); return supabase; }
function refresh(tripId: string, dayId: string) { revalidatePath(`/app/trips/${tripId}/itinerary`); revalidatePath(`/app/trips/${tripId}/itinerary/${dayId}`); }

export async function createItineraryItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? ""; const dayId = formData.get("dayId")?.toString().trim() ?? ""; const parsed = parseItineraryItem(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !parsed.success) redirect(itemPath(tripId, dayId, "invalid"));
  const supabase = await client(tripId, dayId);
  const { data, error } = await supabase.rpc("create_itinerary_item", { target_day_id: dayId, new_item_type: parsed.data.type, item_title: parsed.data.title, item_start_time: parsed.data.startTime, item_end_time: parsed.data.endTime, item_notes: parsed.data.notes, linked_place_id: parsed.data.placeId });
  if (error || !data) redirect(itemPath(tripId, dayId, "error")); refresh(tripId, dayId); redirect(itemPath(tripId, dayId, "created"));
}

export async function updateItineraryItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? ""; const dayId = formData.get("dayId")?.toString().trim() ?? ""; const itemId = formData.get("itemId")?.toString().trim() ?? ""; const parsed = parseItineraryItem(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !uuidPattern.test(itemId) || !parsed.success) redirect(itemPath(tripId, dayId, "invalid"));
  const supabase = await client(tripId, dayId);
  const { data, error } = await supabase.rpc("update_itinerary_item", { target_item_id: itemId, new_item_type: parsed.data.type, item_title: parsed.data.title, item_start_time: parsed.data.startTime, item_end_time: parsed.data.endTime, item_notes: parsed.data.notes, linked_place_id: parsed.data.placeId });
  if (error || data !== "updated") redirect(itemPath(tripId, dayId, "error")); refresh(tripId, dayId); redirect(itemPath(tripId, dayId, "updated"));
}

export async function moveItineraryItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? ""; const dayId = formData.get("dayId")?.toString().trim() ?? ""; const itemId = formData.get("itemId")?.toString().trim() ?? ""; const raw = formData.get("direction")?.toString();
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !uuidPattern.test(itemId) || !["up","down"].includes(raw ?? "")) redirect(itemPath(tripId, dayId, "invalid"));
  const supabase = await client(tripId, dayId); const { data, error } = await supabase.rpc("move_itinerary_item", { target_item_id: itemId, direction: raw === "up" ? -1 : 1 });
  if (error || !data) redirect(itemPath(tripId, dayId, "error")); refresh(tripId, dayId); redirect(itemPath(tripId, dayId, data));
}

export async function removeItineraryItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? ""; const dayId = formData.get("dayId")?.toString().trim() ?? ""; const itemId = formData.get("itemId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !uuidPattern.test(itemId)) redirect(itemPath(tripId, dayId, "invalid"));
  const supabase = await client(tripId, dayId); const { data, error } = await supabase.rpc("remove_itinerary_item", { target_item_id: itemId });
  if (error || data !== "removed") redirect(itemPath(tripId, dayId, "error")); refresh(tripId, dayId); redirect(itemPath(tripId, dayId, "removed"));
}
