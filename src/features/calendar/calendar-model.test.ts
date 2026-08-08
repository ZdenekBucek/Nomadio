import { describe, expect, it } from "vitest";
import { buildCalendarAgenda, buildMonthCalendar, filterAgenda, groupAgendaByDate, monthStart, monthWeeks, tripColorClass, weekTripSegments } from "./calendar-model";
import type { AccommodationRow, TaskRow } from "@/lib/supabase/database.types";
import type { BudgetRow } from "@/features/budget/budget-model";

const trip = { end_date: "2026-10-18", id: "trip-a", name: "Jižní Korea", start_date: "2026-10-14" };
const accommodation = { check_in_date: "2026-10-15", check_in_time: "15:00:00", check_out_date: "2026-10-18", check_out_time: "11:00:00", id: "stay-a", name: "Hotel Soul", trip_id: trip.id } as AccommodationRow;
const task = { due_date: "2026-10-12", id: "task-a", status: "todo", title: "Koupit eSIM", trip_id: trip.id } as TaskRow;
const paidTask = { ...task, id: "task-done", status: "completed" } as TaskRow;
const budget = { balanceDueDate: "2026-10-12", currency: "CZK", href: "/app/trips/trip-a/budget", id: "budget-a", name: "Hotel Soul", remainingAmount: 13500, tripId: trip.id } as BudgetRow & { tripId: string };

describe("calendar month model", () => {
  it("starts the grid on Monday and uses five or six complete weeks", () => {
    const weeks = monthWeeks(monthStart(new Date("2026-10-20T00:00:00Z")));
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]!.getUTCDay()).toBe(1);
    expect(weeks[0]![0]!.toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it("splits trips by week and clips a trip at the visible month boundary", () => {
    const weeks = monthWeeks(new Date("2026-10-01T00:00:00Z"));
    const segments = weeks.map((week) => weekTripSegments(week, [trip, { ...trip, id: "trip-b", end_date: "2026-10-05", start_date: "2026-09-28" }]));
    expect(segments[0]).toHaveLength(1);
    expect(segments[2]).toHaveLength(1);
    expect(segments[0]![0]!.startColumn).toBe(1);
    expect(segments[0]![0]!.endColumn).toBe(7);
  });

  it("keeps overlapping trips as independent segments linked to their trip overview", () => {
    const week = monthWeeks(new Date("2026-10-01T00:00:00Z"))[2]!;
    const segments = weekTripSegments(week, [trip, { ...trip, id: "trip-b", name: "Vídeň", start_date: "2026-10-15", end_date: "2026-10-16" }]);
    expect(segments).toHaveLength(2);
    expect(segments.map((segment) => `/app/trips/${segment.trip.id}`)).toEqual(["/app/trips/trip-a", "/app/trips/trip-b"]);
  });

  it("assigns overlapping trips to lanes and preserves continuation edges", () => {
    const calendar = buildMonthCalendar(new Date("2026-08-01T00:00:00Z"), [
      { ...trip, end_date: "2026-09-05", start_date: "2026-08-28" },
      { ...trip, id: "trip-b", name: "Vídeň", end_date: "2026-08-31", start_date: "2026-08-30" },
      { ...trip, id: "trip-c", name: "Brno", end_date: "2026-08-31", start_date: "2026-08-30" },
      { ...trip, id: "trip-d", name: "Paříž", end_date: "2026-08-31", start_date: "2026-08-30" },
    ]);
    expect(calendar.weeks).toHaveLength(6);
    const overlapWeek = calendar.weeks[4]!;
    expect(overlapWeek.segments).toHaveLength(3);
    expect(overlapWeek.hiddenSegments).toHaveLength(1);
    expect(overlapWeek.segments[0]?.continuesAfter).toBe(true);
    expect(tripColorClass("trip-a")).toBe(tripColorClass("trip-a"));
  });

  it("builds the exact three week segments for Lofoty from 25 August to 9 September", () => {
    const lofoty = {
      end_date: "2026-09-09",
      id: "lofoty",
      name: "Norsko – Lofoty 2026",
      start_date: "2026-08-25",
    };
    const august = buildMonthCalendar(new Date("2026-08-01T00:00:00Z"), [lofoty]);
    const september = buildMonthCalendar(new Date("2026-09-01T00:00:00Z"), [lofoty]);
    const first = august.weeks[4]!.segments[0]!;
    const middle = august.weeks[5]!.segments[0]!;
    const last = september.weeks[1]!.segments[0]!;

    expect(first).toMatchObject({ startColumn: 2, endColumn: 7, continuesBefore: false, continuesAfter: true, lane: 0, href: "/app/trips/lofoty" });
    expect(middle).toMatchObject({ startColumn: 1, endColumn: 7, continuesBefore: true, continuesAfter: true, lane: 0 });
    expect(last).toMatchObject({ startColumn: 1, endColumn: 3, continuesBefore: true, continuesAfter: false, lane: 0 });
  });
});

describe("calendar agenda model", () => {
  const agenda = buildCalendarAgenda({ accommodations: [accommodation], budget: [budget], tasks: [task, paidTask], transports: [{ date: "2026-10-14", href: "/app/trips/trip-a/transport?edit=booking-a", id: "segment-a", startTime: "11:00", subtitle: "DY1042", title: "Let Praha → Soul", tripId: trip.id }], trips: [trip] }, "2026-10-13");

  it("derives trip, accommodation, transport, payment and pending task events", () => {
    expect(agenda.map((item) => item.type)).toEqual(["payment", "task", "trip_start", "transport", "accommodation_check_in", "trip_end", "accommodation_check_out"]);
    expect(agenda.find((item) => item.type === "payment")?.isOverdue).toBe(true);
    expect(agenda.find((item) => item.type === "transport")?.href).toContain("/transport");
    expect(agenda.some((item) => item.id === "task:task-done")).toBe(false);
  });

  it("does not create a payment event when no money remains", () => {
    const result = buildCalendarAgenda({ accommodations: [], budget: [{ ...budget, remainingAmount: 0 }], tasks: [], transports: [], trips: [trip] }, "2026-10-01");
    expect(result.some((item) => item.type === "payment")).toBe(false);
  });

  it("filters by trip and category and groups chronologically by date", () => {
    expect(filterAgenda(agenda, trip.id, "transport", true, "2026-10-01")).toHaveLength(1);
    expect(filterAgenda(agenda, "other-trip", "all", true, "2026-10-01")).toHaveLength(0);
    expect(groupAgendaByDate(agenda).map(([date]) => date)).toEqual(["2026-10-12", "2026-10-14", "2026-10-15", "2026-10-18"]);
  });
});
