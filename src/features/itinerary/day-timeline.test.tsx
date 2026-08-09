import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ItineraryDayRow, ItineraryItemRow } from "@/lib/supabase/database.types";

vi.mock("./item-actions", () => ({
  createItineraryItem: vi.fn(),
  moveItineraryItem: vi.fn(),
  moveItineraryItemToDay: vi.fn(),
  removeItineraryItem: vi.fn(),
  updateItineraryItem: vi.fn(),
}));
import { DayTimeline } from "./day-timeline";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const dayId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base = { created_at:"2026-08-04T00:00:00Z", created_by:"user", day_id:dayId, end_time:null, notes:null, place_id:null, updated_at:"2026-08-04T00:00:00Z" };
const items: ItineraryItemRow[] = [
  { ...base, id:"1", item_type:"activity", title:"Chrám", start_time:"09:00:00", sort_order:0 },
  { ...base, id:"2", item_type:"note", title:"Koupit SIM", start_time:null, sort_order:1 },
];

function day(id: string, name: string, date: string | null, sortOrder: number | null): ItineraryDayRow {
  return { city:null, created_at:"2026-08-04T00:00:00Z", created_by:"user", day_date:date, id, is_reserve:false, name, sort_order:sortOrder, status:"plan", trip_id:tripId, updated_at:"2026-08-04T00:00:00Z" };
}

const days = [
  day(dayId, "Aktuální den", "2027-05-01", null),
  day("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Druhý den", "2027-05-02", null),
  day("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Volný plán", null, 0),
];

afterEach(cleanup);

describe("DayTimeline", () => {
  it("renders ordered items and editor controls", () => {
    render(<DayTimeline canEdit dayId={dayId} days={days} items={items} places={[]} tripId={tripId} />);
    expect(screen.getByText("Chrám")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("Přidat bod do timeline")).toBeInTheDocument();
    expect(screen.getAllByText("Upravit bod")).toHaveLength(2);
  });

  it("offers dated and undated target days but excludes the current day", () => {
    render(<DayTimeline canEdit dayId={dayId} days={days} items={items} places={[]} tripId={tripId} />);
    expect(screen.getAllByText("Přesunout do jiného dne")).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: /Druhý den/ })).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: "Plán bez data · Volný plán" })).toHaveLength(2);
    expect(screen.queryByRole("option", { name: /Aktuální den/ })).not.toBeInTheDocument();
  });

  it("is read-only for viewer", () => {
    render(<DayTimeline canEdit={false} dayId={dayId} days={days} items={items} places={[]} tripId={tripId} />);
    expect(screen.getByText("Koupit SIM")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Přidat bod do timeline")).not.toBeInTheDocument();
    expect(screen.queryByText("Přesunout do jiného dne")).not.toBeInTheDocument();
  });

  it("uses shared TimePicker controls with canonical local values", () => {
    const { container } = render(<DayTimeline canEdit dayId={dayId} days={days} items={items} places={[]} tripId={tripId} />);
    fireEvent.click(screen.getAllByText("Upravit bod")[0]!);
    expect((container.querySelector('input[name="startTime"]') as HTMLInputElement).value).toBe("09:00");
    expect((container.querySelector('input[name="endTime"]') as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll('input[type="time"]').length).toBeGreaterThanOrEqual(2);
  });
});
