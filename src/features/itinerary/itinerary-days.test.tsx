import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ItineraryDayRow } from "@/lib/supabase/database.types";

vi.mock("./actions", () => ({ createItineraryDay: vi.fn(), moveItineraryDay: vi.fn(), removeItineraryDay: vi.fn(), updateItineraryDay: vi.fn() }));
import { ItineraryDays } from "./itinerary-days";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const base = { city: null, created_at: "2026-08-04T00:00:00Z", created_by: "user", is_reserve: false, status: "plan" as const, trip_id: tripId, updated_at: "2026-08-04T00:00:00Z" };
const days: ItineraryDayRow[] = [
  { ...base, id: "1", day_date: "2027-05-02", name: "Druhý den", sort_order: null },
  { ...base, id: "2", day_date: "2027-05-01", name: "První den", sort_order: null, status: "confirmed" },
  { ...base, id: "3", day_date: null, name: "Deštivý plán", sort_order: 0, is_reserve: true },
];

afterEach(cleanup);
describe("ItineraryDays", () => {
  it("shows dated and undated groups with editor controls", () => { render(<ItineraryDays canEdit days={days} tripId={tripId}/>); expect(screen.getByText("Dny cesty")).toBeInTheDocument(); expect(screen.getByText("Plány bez data")).toBeInTheDocument(); expect(screen.getByText("Přidat datovaný den")).toBeInTheDocument(); expect(screen.getByText("Přidat plán bez data")).toBeInTheDocument(); expect(screen.getAllByText("Upravit den")).toHaveLength(3); });
  it("keeps itinerary read-only for viewers", () => { render(<ItineraryDays canEdit={false} days={days} tripId={tripId}/>); expect(screen.getByText("Deštivý plán")).toBeInTheDocument(); expect(screen.queryByText("Upravit den")).not.toBeInTheDocument(); expect(screen.queryByRole("button")).not.toBeInTheDocument(); });
});
