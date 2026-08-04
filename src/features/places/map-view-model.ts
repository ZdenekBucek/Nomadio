import type { PlaceCategory, TripPlaceRow } from "@/lib/supabase/database.types";

export type MapPlace = {
  address: string | null;
  category: PlaceCategory;
  city: string | null;
  countryCode: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
};

export type TripMapModel = {
  mapped: MapPlace[];
  withoutCoordinates: Pick<TripPlaceRow, "id" | "name">[];
};

export function createTripMapModel(places: TripPlaceRow[]): TripMapModel {
  const mapped: MapPlace[] = [];
  const withoutCoordinates: Pick<TripPlaceRow, "id" | "name">[] = [];
  for (const place of places) {
    if (place.latitude === null || place.longitude === null) {
      withoutCoordinates.push({ id: place.id, name: place.name });
      continue;
    }
    mapped.push({
      address: place.address,
      category: place.category,
      city: place.city,
      countryCode: place.country_code,
      id: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
    });
  }
  return { mapped, withoutCoordinates };
}
