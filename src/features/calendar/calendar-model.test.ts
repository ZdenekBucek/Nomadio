import { describe, expect, it } from "vitest";
import { buildCalendarAgenda, buildMonthCalendar, calendarMonthEvents, calendarPaymentEvents, filterAgenda, groupAgendaByDate, monthStart, monthWeeks, tripColorClass, weekTripSegments } from "./calendar-model";
import type { AccommodationRow, TaskRow } from "@/lib/supabase/database.types";
import type { BudgetPaymentItem } from "@/features/budget/budget-domain";

const trip = { end_date: "2026-10-18", id: "trip-a", name: "Jižní Korea", start_date: "2026-10-14" };
const accommodation = { check_in_date: "2026-10-15", check_in_time: "15:00:00", check_out_date: "2026-10-18", check_out_time: "11:00:00", id: "stay-a", name: "Hotel Soul", trip_id: trip.id } as AccommodationRow;
const task = { due_date: "2026-10-12", id: "task-a", status: "todo", title: "Koupit eSIM", trip_id: trip.id } as TaskRow;
const paidTask = { ...task, id: "task-done", status: "completed" } as TaskRow;
const payment = (overrides: Partial<BudgetPaymentItem> = {}): BudgetPaymentItem => ({ amount: 18500, currency: "CZK", dueDate: "2026-10-12", id: "accommodation:stay-a", paidAmount: 5000, paymentStatus: "partially_paid", remainingAmount: 13500, sourceId: "stay-a", sourceType: "accommodation", title: "Hotel Soul", tripId: trip.id, ...overrides });

describe("calendar month model", () => {
  it("projects only payments, transport and accommodation boundaries into month events", () => {
    const agenda = buildCalendarAgenda({
      accommodations: [accommodation],
      payments: calendarPaymentEvents([
        payment(),
        payment({ id: "manual:meal", sourceType: "manual", title: "Večeře" }),
      ]),
      tasks: [task],
      transports: [{ date: "2026-10-14", href: "/app/trips/trip-a/transport", id: "segment-a", startTime: "11:00", subtitle: "DY1042", title: "Let", tripId: trip.id }],
      trips: [trip],
    }, "2026-10-01");

    const events = calendarMonthEvents(agenda);
    expect(events.map((event) => event.type)).toEqual([
      "payment",
      "transport",
      "accommodation_check_in",
      "accommodation_check_out",
    ]);
    expect(events.some((event) => event.title === "Večeře")).toBe(false);
    expect(events.some((event) => event.title === "Koupit eSIM" || event.title === "Začíná Jižní Korea")).toBe(false);
  });

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
  const agenda = buildCalendarAgenda({ accommodations: [accommodation], payments: calendarPaymentEvents([payment()]), tasks: [task, paidTask], transports: [{ date: "2026-10-14", href: "/app/trips/trip-a/transport?edit=booking-a", id: "segment-a", startTime: "11:00", subtitle: "DY1042", title: "Let Praha → Soul", tripId: trip.id }], trips: [trip] }, "2026-10-13");

  it("derives trip, accommodation, transport, payment and pending task events", () => {
    expect(agenda.map((item) => item.type)).toEqual(["payment", "task", "trip_start", "transport", "accommodation_check_in", "trip_end", "accommodation_check_out"]);
    expect(agenda.find((item) => item.type === "payment")).toMatchObject({ amount: 13500, currency: "CZK", href: "/app/trips/trip-a/accommodation", isOverdue: true, title: "Doplatek Hotel Soul" });
    expect(agenda.find((item) => item.type === "transport")?.href).toContain("/transport");
    expect(agenda.some((item) => item.id === "task:task-done")).toBe(false);
  });

  it("creates upcoming commitments and excludes paid, zero-remaining and undated items", () => {
    const events = calendarPaymentEvents([
      payment({ dueDate: "2026-10-20", id: "transport:train", remainingAmount: 500, sourceId: "train", sourceType: "transport", title: "Vlak" }),
      payment({ id: "paid", paidAmount: 18500, paymentStatus: "paid", remainingAmount: 0 }),
      payment({ dueDate: null, id: "undated" }),
    ]);
    expect(events).toEqual([expect.objectContaining({ amount: 500, date: "2026-10-20", href: "/app/trips/trip-a/transport", title: "Doplatek Vlak" })]);
  });

  it("keeps currencies and accessible trips separate without FX aggregation", () => {
    const sharedTrip = { ...trip, id: "trip-shared", name: "Sdílená cesta" };
    const payments = calendarPaymentEvents([
      payment(),
      payment({ currency: "EUR", dueDate: "2026-10-16", id: "transport:ferry", remainingAmount: 200, sourceId: "ferry", sourceType: "transport", title: "Trajekt", tripId: sharedTrip.id }),
    ]);
    const result = buildCalendarAgenda({ accommodations: [], payments, tasks: [], transports: [], trips: [trip, sharedTrip] }, "2026-10-13").filter((item) => item.type === "payment");
    expect(result).toHaveLength(2);
    expect(result.map((item) => [item.tripId, item.amount, item.currency])).toEqual([[trip.id, 13500, "CZK"], [sharedTrip.id, 200, "EUR"]]);
  });

  it("filters by trip and category and groups chronologically by date", () => {
    expect(filterAgenda(agenda, trip.id, "transport", true, "2026-10-01")).toHaveLength(1);
    expect(filterAgenda(agenda, trip.id, "payment", true, "2026-10-01").every((item) => item.type === "payment")).toBe(true);
    expect(filterAgenda(agenda, "other-trip", "all", true, "2026-10-01")).toHaveLength(0);
    expect(groupAgendaByDate(agenda).map(([date]) => date)).toEqual(["2026-10-12", "2026-10-14", "2026-10-15", "2026-10-18"]);
  });
});
