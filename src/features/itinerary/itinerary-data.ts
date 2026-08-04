import "server-only";

import { cache } from "react";
import type { ItineraryDayRow, ItineraryItemRow, TripPlaceRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const getItineraryDays = cache(async (tripId: string): Promise<ItineraryDayRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("itinerary_days").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data ?? [];
});

export const getTripPlaces = cache(async (tripId: string): Promise<TripPlaceRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trip_places").select("*").eq("trip_id", tripId).order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const getItineraryDay = cache(async (dayId: string): Promise<{ day: ItineraryDayRow; items: ItineraryItemRow[] } | null> => {
  const supabase = await createClient();
  const [dayResult, itemResult] = await Promise.all([
    supabase.from("itinerary_days").select("*").eq("id", dayId).maybeSingle(),
    supabase.from("itinerary_items").select("*").eq("day_id", dayId).order("sort_order", { ascending: true }),
  ]);
  if (dayResult.error) throw dayResult.error;
  if (itemResult.error) throw itemResult.error;
  if (!dayResult.data) return null;
  return { day: dayResult.data, items: itemResult.data ?? [] };
});
