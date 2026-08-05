import { describe, expect, it } from "vitest";
import type { TripPlaceRow } from "@/lib/supabase/database.types";
import { createTripMapModel } from "./map-view-model";

function place(overrides: Partial<TripPlaceRow> = {}): TripPlaceRow {
  return {
    address: null, attribution: null, category: "custom", category_overridden: true, city: null,
    country_code: null, created_at: "2026-08-04T00:00:00Z", created_by: "user",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", latitude: 67.23, longitude: 14.61,
    name: "Saltstraumen", provider: "manual", provider_category: null,
    provider_place_id: null, trip_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    updated_at: "2026-08-04T00:00:00Z", ...overrides,
  };
}

describe("createTripMapModel", () => {
  it("keeps only serializable map fields", () => {
    expect(createTripMapModel([place()]).mapped).toEqual([expect.objectContaining({ name: "Saltstraumen", latitude: 67.23, longitude: 14.61 })]);
  });

  it("separates places without a complete coordinate pair", () => {
    const result = createTripMapModel([place({ id: "no-location", latitude: null, longitude: null, name: "Hotel" })]);
    expect(result.mapped).toEqual([]);
    expect(result.withoutCoordinates).toEqual([{ id: "no-location", name: "Hotel" }]);
  });
});
