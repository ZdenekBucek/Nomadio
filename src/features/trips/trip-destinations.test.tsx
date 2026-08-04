import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TripDestinationRow } from "@/lib/supabase/database.types";

vi.mock("./settings-actions", () => ({
  addTripDestination: vi.fn(),
  moveTripDestination: vi.fn(),
  removeTripDestination: vi.fn(),
  setPrimaryTripDestination: vi.fn(),
  updateTripDestination: vi.fn(),
}));

import { TripDestinations } from "./trip-destinations";

const destinations: TripDestinationRow[] = [
  {
    city: "Tokio",
    continent: "asia",
    continent_overridden: false,
    country_code: "JP",
    country_name: "Japonsko",
    created_at: "2026-08-04T00:00:00Z",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    is_primary: true,
    sort_order: 0,
    trip_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    updated_at: "2026-08-04T00:00:00Z",
  },
  {
    city: "Kjóto",
    continent: "asia",
    continent_overridden: false,
    country_code: "JP",
    country_name: "Japonsko",
    created_at: "2026-08-04T00:00:00Z",
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    is_primary: false,
    sort_order: 1,
    trip_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    updated_at: "2026-08-04T00:00:00Z",
  },
];

afterEach(cleanup);

describe("TripDestinations", () => {
  it("shows ordered destinations and editor controls", () => {
    render(<TripDestinations canEdit destinations={destinations} tripId={destinations[0]!.trip_id} />);

    expect(screen.getByText("Tokio, Japonsko")).toBeInTheDocument();
    expect(screen.getByText("Kjóto, Japonsko")).toBeInTheDocument();
    expect(screen.getByText("Přidat další destinaci")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nastavit jako hlavní" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Odebrat" })).toBeInTheDocument();
  });

  it("keeps the same data read-only for a viewer", () => {
    render(<TripDestinations canEdit={false} destinations={destinations} tripId={destinations[0]!.trip_id} />);

    expect(screen.getByText("Tokio, Japonsko")).toBeInTheDocument();
    expect(screen.queryByText("Přidat další destinaci")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
