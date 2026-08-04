import { describe, expect, it } from "vitest";

import type { TripRow } from "@/lib/supabase/database.types";

import { getEffectiveTripStatus, tripDurationLabel, tripTimingLabel } from "./trip-view";

const trip: TripRow = {
  archived_at: null,
  cities: [],
  continent: null,
  countries: [],
  cover_attribution: null,
  cover_kind: "gradient",
  cover_storage_path: null,
  cover_url: null,
  cover_variant: "violet",
  created_at: "2026-08-04T00:00:00Z",
  created_by: "user-1",
  currency: "JPY",
  description: null,
  end_date: "2027-05-30",
  id: "trip-1",
  name: "Japonsko",
  start_date: "2027-05-15",
  status: "planning",
  status_before_archive: null,
  timezone: "Europe/Prague",
  updated_at: "2026-08-04T00:00:00Z",
};

describe("trip list presentation", () => {
  it("derives active and completed states from dates", () => {
    expect(getEffectiveTripStatus(trip, new Date("2027-05-20T10:00:00Z"))).toBe("active");
    expect(getEffectiveTripStatus(trip, new Date("2027-06-01T10:00:00Z"))).toBe("completed");
  });

  it("formats countdown and inclusive duration", () => {
    expect(tripTimingLabel(trip, new Date("2027-05-10T10:00:00Z"))).toBe("Za 5 dní");
    expect(tripDurationLabel(trip)).toBe("16 dní");
  });

  it("keeps an explicit archive state regardless of dates", () => {
    expect(
      getEffectiveTripStatus(
        { ...trip, status: "archived" },
        new Date("2027-05-20T10:00:00Z"),
      ),
    ).toBe("archived");
  });
});
