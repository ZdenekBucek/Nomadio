"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseItineraryDay } from "./itinerary-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function path(tripId: string, status: string) {
  return uuidPattern.test(tripId) ? `/app/trips/${tripId}/itinerary?day=${status}` : "/app/trips";
}

async function client(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/itinerary`);
  return supabase;
}

function refresh(tripId: string) {
  revalidatePath(`/app/trips/${tripId}`);
  revalidatePath(`/app/trips/${tripId}/itinerary`);
}

export async function createItineraryDay(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const parsed = parseItineraryDay(formData);
  if (!uuidPattern.test(tripId) || !parsed.success) redirect(path(tripId, "invalid"));
  const supabase = await client(tripId);
  const { error } = await supabase.rpc("create_itinerary_day", { target_trip_id: tripId, assigned_date: parsed.data.date, day_city: parsed.data.city, day_name: parsed.data.name, day_status: parsed.data.status, reserve_day: parsed.data.isReserve });
  if (error) redirect(path(tripId, error.code === "23505" ? "date-taken" : "error"));
  refresh(tripId);
  redirect(path(tripId, "created"));
}

export async function updateItineraryDay(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() ?? "";
  const parsed = parseItineraryDay(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !parsed.success) redirect(path(tripId, "invalid"));
  const supabase = await client(tripId);
  const { data, error } = await supabase.rpc("update_itinerary_day", { target_day_id: dayId, assigned_date: parsed.data.date, day_city: parsed.data.city, day_name: parsed.data.name, day_status: parsed.data.status, reserve_day: parsed.data.isReserve });
  if (error || data !== "updated") redirect(path(tripId, error?.code === "23505" ? "date-taken" : "error"));
  refresh(tripId);
  redirect(path(tripId, "updated"));
}

export async function moveItineraryDay(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() ?? "";
  const raw = formData.get("direction")?.toString();
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !["up", "down"].includes(raw ?? "")) redirect(path(tripId, "invalid"));
  const supabase = await client(tripId);
  const { data, error } = await supabase.rpc("move_undated_itinerary_day", { target_day_id: dayId, direction: raw === "up" ? -1 : 1 });
  if (error || !data) redirect(path(tripId, "error"));
  refresh(tripId);
  redirect(path(tripId, data === "moved" ? "moved" : data));
}

export async function removeItineraryDay(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId)) redirect(path(tripId, "invalid"));
  const supabase = await client(tripId);
  const { data, error } = await supabase.rpc("remove_itinerary_day", { target_day_id: dayId });
  if (error || data !== "removed") redirect(path(tripId, "error"));
  refresh(tripId);
  redirect(path(tripId, "removed"));
}
