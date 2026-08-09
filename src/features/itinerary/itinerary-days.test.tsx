import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  it("makes each day card navigable without a separate detail CTA", () => { render(<ItineraryDays canEdit days={days} tripId={tripId}/>); expect(screen.getByText("Dny cesty")).toBeInTheDocument(); expect(screen.getByText("Plány bez data")).toBeInTheDocument(); expect(screen.getByText("Přidat datovaný den")).toBeInTheDocument(); expect(screen.getByText("Přidat plán bez data")).toBeInTheDocument(); expect(screen.queryByText("Otevřít detail dne")).not.toBeInTheDocument(); expect(screen.getByRole("link", { name: "Otevřít detail dne První den" })).toHaveAttribute("href", `/app/trips/${tripId}/itinerary/2`); });
  it("keeps itinerary read-only for viewers", () => { render(<ItineraryDays canEdit={false} days={days} tripId={tripId}/>); expect(screen.getByText("Deštivý plán")).toBeInTheDocument(); expect(screen.queryByText("Upravit den")).not.toBeInTheDocument(); expect(screen.queryByRole("button")).not.toBeInTheDocument(); });
  it("keeps edit action separate from card navigation", () => { const { container } = render(<ItineraryDays canEdit days={days} tripId={tripId}/>); const editActions = screen.getAllByLabelText("Upravit den"); expect(editActions).toHaveLength(3); fireEvent.click(editActions[0]!); expect(container.querySelectorAll("details[open]")).toHaveLength(1); expect(editActions[0]).not.toHaveAttribute("href"); });
  it("uses a shared DatePicker for canonical day dates", () => {
    const { container } = render(<ItineraryDays canEdit days={days} tripId={tripId}/>);
    fireEvent.click(screen.getAllByText("Upravit den")[0]!);
    expect(screen.getAllByRole("button", { name: "Datum (volitelné)" }).length).toBeGreaterThan(0);
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument();
    expect((container.querySelector('input[name="date"][value="2027-05-02"]') as HTMLInputElement).value).toBe("2027-05-02");
  });
});
