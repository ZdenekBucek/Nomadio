import { describe, expect, it } from "vitest";
import type {
  ItineraryItemRow,
  TripPlaceRow,
} from "@/lib/supabase/database.types";
import { createDayMapModel } from "./day-map-view-model";

const itemBase: Omit<ItineraryItemRow, "id" | "sort_order" | "title"> = {
  created_at: "2026-08-04T00:00:00Z",
  created_by: "user",
  day_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  end_time: null,
  item_type: "activity",
  notes: null,
  place_id: null,
  start_time: null,
  updated_at: "2026-08-04T00:00:00Z",
};

function item(
  id: string,
  sortOrder: number,
  overrides: Partial<ItineraryItemRow> = {},
): ItineraryItemRow {
  return {
    ...itemBase,
    id,
    sort_order: sortOrder,
    title: `Bod ${id}`,
    ...overrides,
  };
}

function place(
  id: string,
  overrides: Partial<TripPlaceRow> = {},
): TripPlaceRow {
  return {
    address: null,
    category: "custom",
    category_overridden: true,
    city: null,
    country_code: null,
    created_at: "2026-08-04T00:00:00Z",
    created_by: "user",
    id,
    latitude: 49.2,
    longitude: 16.6,
    name: `Místo ${id}`,
    provider: "manual",
    provider_category: null,
    provider_place_id: null,
    trip_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    updated_at: "2026-08-04T00:00:00Z",
    ...overrides,
  };
}

describe("createDayMapModel", () => {
  it("numbers mapped points in timeline order", () => {
    const result = createDayMapModel(
      [
        item("later", 2, { place_id: "second" }),
        item("first", 0, {
          end_time: "10:30:00",
          place_id: "first",
          start_time: "09:00:00",
        }),
      ],
      [place("first"), place("second")],
    );

    expect(result.points.map(({ itemId, sequence }) => ({ itemId, sequence }))).toEqual([
      { itemId: "first", sequence: 1 },
      { itemId: "later", sequence: 2 },
    ]);
    expect(result.points[0]?.timeLabel).toBe("09:00–10:30");
  });

  it("separates linked places without coordinates", () => {
    const result = createDayMapModel(
      [item("hotel-stop", 0, { place_id: "hotel" })],
      [place("hotel", { latitude: null, longitude: null, name: "Hotel" })],
    );

    expect(result.points).toEqual([]);
    expect(result.withoutCoordinates).toEqual([
      {
        itemId: "hotel-stop",
        itemTitle: "Bod hotel-stop",
        placeName: "Hotel",
      },
    ]);
  });

  it("counts timeline items without an available place", () => {
    const result = createDayMapModel(
      [item("note", 0), item("missing", 1, { place_id: "unknown" })],
      [],
    );

    expect(result.unlinkedItemCount).toBe(2);
  });
});
