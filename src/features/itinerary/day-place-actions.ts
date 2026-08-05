"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlaceCategory } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { parseDayPlaceDetails } from "./day-place-input";
import { parseExternalPlace } from "./external-place-input";
import { parsePlace } from "./place-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function path(tripId: string, dayId: string, status: string) {
  return uuidPattern.test(tripId) && uuidPattern.test(dayId)
    ? `/app/trips/${tripId}/itinerary/${dayId}?item=${status}`
    : "/app/trips";
}

async function client(tripId: string, dayId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/itinerary/${dayId}`);
  return supabase;
}

function refresh(tripId: string, dayId: string) {
  revalidatePath(`/app/trips/${tripId}/itinerary`);
  revalidatePath(`/app/trips/${tripId}/itinerary/${dayId}`);
  revalidatePath(`/app/trips/${tripId}/map`);
}

type PlaceArgs = {
  place_address: string | null;
  place_attribution: string | null;
  place_category: PlaceCategory;
  place_city: string | null;
  place_country_code: string | null;
  place_latitude: number | null;
  place_longitude: number | null;
  place_name: string;
  place_provider_category: string | null;
  source_provider: "geoapify" | "manual" | "mapbox";
  source_provider_place_id: string | null;
  suggested_place_category: PlaceCategory;
};

async function addPlace(formData: FormData, place: PlaceArgs) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() ?? "";
  const details = parseDayPlaceDetails(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(dayId) || !details.success) {
    redirect(path(tripId, dayId, "place-invalid"));
  }
  const supabase = await client(tripId, dayId);
  const { data, error } = await supabase.rpc("add_place_to_itinerary_day", {
    target_trip_id: tripId,
    target_day_id: dayId,
    ...place,
    item_start_time: details.data.startTime,
    item_end_time: details.data.endTime,
    item_notes: details.data.notes,
  });
  if (error || !data) redirect(path(tripId, dayId, "place-error"));
  refresh(tripId, dayId);
  redirect(path(tripId, dayId, "place-added"));
}

export async function addExternalPlaceToDay(formData: FormData) {
  const parsed = parseExternalPlace(formData);
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() ?? "";
  if (!parsed.success) redirect(path(tripId, dayId, "place-invalid"));
  const value = parsed.data;
  return addPlace(formData, {
    place_address: value.address,
    place_attribution: value.attribution,
    place_category: value.category,
    place_city: value.city,
    place_country_code: value.countryCode,
    place_latitude: value.latitude,
    place_longitude: value.longitude,
    place_name: value.name,
    place_provider_category: value.providerCategory,
    source_provider: value.provider,
    source_provider_place_id: value.providerPlaceId,
    suggested_place_category: value.suggestedCategory,
  });
}

export async function addManualPlaceToDay(formData: FormData) {
  const parsed = parsePlace(formData);
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const dayId = formData.get("dayId")?.toString().trim() ?? "";
  if (!parsed.success || parsed.data.latitude !== null || parsed.data.longitude !== null) {
    redirect(path(tripId, dayId, "place-invalid"));
  }
  return addPlace(formData, {
    place_address: parsed.data.address,
    place_attribution: null,
    place_category: parsed.data.category,
    place_city: parsed.data.city,
    place_country_code: parsed.data.countryCode,
    place_latitude: null,
    place_longitude: null,
    place_name: parsed.data.name,
    place_provider_category: null,
    source_provider: "manual",
    source_provider_place_id: null,
    suggested_place_category: parsed.data.category,
  });
}
