import "server-only";

import { cache } from "react";
import type { AccommodationRow, TripPlaceRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { sortAccommodations, type AccommodationWithPlace } from "./accommodation-model";

export const getAccommodations = cache(async (tripId: string): Promise<AccommodationWithPlace[]> => {
  const supabase = await createClient();
  const [accommodationsResult, placesResult] = await Promise.all([
    supabase.from("accommodations").select("*").eq("trip_id", tripId),
    supabase.from("trip_places").select("*").eq("trip_id", tripId),
  ]);
  if (accommodationsResult.error) throw accommodationsResult.error;
  if (placesResult.error) throw placesResult.error;
  const places = new Map((placesResult.data as TripPlaceRow[]).map((place) => [place.id, place]));
  return sortAccommodations((accommodationsResult.data as AccommodationRow[]).map((item) => ({
    ...item,
    place: item.place_id ? places.get(item.place_id) ?? null : null,
  })));
});
