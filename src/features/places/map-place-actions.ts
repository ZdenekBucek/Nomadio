"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseMapPlace } from "./map-place-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createMapSelectedPlace(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() || null;
  const continueToItinerary = Boolean(dayId) && formData.get("continueToItinerary") === "on";
  const addToDay = !continueToItinerary && formData.get("addToDay") === "on";
  const returnTo = dayId
    ? `/app/trips/${tripId}/itinerary/${dayId}`
    : `/app/trips/${tripId}/map`;
  const parsed = parseMapPlace(formData);
  if (!uuidPattern.test(tripId) || (dayId !== null && !uuidPattern.test(dayId)) || !parsed.success) {
    redirect(uuidPattern.test(tripId) ? `${returnTo}?mapPlace=invalid` : "/app/trips");
  }
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=${returnTo}`);
  const { data, error } = await supabase.rpc("create_map_selected_manual_place", {
    add_to_day: Boolean(dayId && addToDay),
    place_address: parsed.data.address,
    place_category: parsed.data.category,
    place_latitude: parsed.data.latitude,
    place_longitude: parsed.data.longitude,
    place_name: parsed.data.name,
    place_notes: parsed.data.notes,
    target_day_id: dayId && addToDay ? dayId : null,
    target_trip_id: tripId,
  });
  if (error || !data) redirect(`${returnTo}?mapPlace=error`);
  revalidatePath(`/app/trips/${tripId}/itinerary`);
  revalidatePath(`/app/trips/${tripId}/itinerary/[dayId]`, "page");
  revalidatePath(`/app/trips/${tripId}/map`);
  if (continueToItinerary && typeof data === "string" && uuidPattern.test(data)) {
    redirect(`${returnTo}?mapPlace=continue&mapPlaceId=${encodeURIComponent(data)}`);
  }
  redirect(`${returnTo}?mapPlace=${dayId && addToDay ? "day-added" : "created"}`);
}
