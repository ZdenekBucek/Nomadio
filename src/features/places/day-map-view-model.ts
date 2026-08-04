import type {
  ItineraryItemRow,
  ItineraryItemType,
  PlaceCategory,
  TripPlaceRow,
} from "@/lib/supabase/database.types";

export type DayMapPoint = {
  address: string | null;
  category: PlaceCategory;
  city: string | null;
  countryCode: string | null;
  itemId: string;
  itemTitle: string;
  itemType: ItineraryItemType;
  latitude: number;
  longitude: number;
  placeId: string;
  placeName: string;
  sequence: number;
  timeLabel: string | null;
};

export type DayMapMissingPoint = {
  itemId: string;
  itemTitle: string;
  placeName: string;
};

export type DayMapModel = {
  points: DayMapPoint[];
  unlinkedItemCount: number;
  withoutCoordinates: DayMapMissingPoint[];
};

function timeLabel(item: ItineraryItemRow): string | null {
  const start = item.start_time?.slice(0, 5) ?? null;
  const end = item.end_time?.slice(0, 5) ?? null;
  if (start && end) return `${start}–${end}`;
  return start ?? end;
}

export function createDayMapModel(
  items: ItineraryItemRow[],
  places: TripPlaceRow[],
): DayMapModel {
  const placesById = new Map(places.map((place) => [place.id, place]));
  const points: DayMapPoint[] = [];
  const withoutCoordinates: DayMapMissingPoint[] = [];
  let unlinkedItemCount = 0;

  const orderedItems = [...items].sort(
    (left, right) => left.sort_order - right.sort_order,
  );

  for (const item of orderedItems) {
    const place = item.place_id ? placesById.get(item.place_id) : null;
    if (!place) {
      unlinkedItemCount += 1;
      continue;
    }

    if (place.latitude === null || place.longitude === null) {
      withoutCoordinates.push({
        itemId: item.id,
        itemTitle: item.title,
        placeName: place.name,
      });
      continue;
    }

    points.push({
      address: place.address,
      category: place.category,
      city: place.city,
      countryCode: place.country_code,
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.item_type,
      latitude: place.latitude,
      longitude: place.longitude,
      placeId: place.id,
      placeName: place.name,
      sequence: points.length + 1,
      timeLabel: timeLabel(item),
    });
  }

  return { points, unlinkedItemCount, withoutCoordinates };
}
