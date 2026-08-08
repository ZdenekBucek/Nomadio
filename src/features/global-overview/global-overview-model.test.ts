import { describe, expect, it } from "vitest";
import { buildGlobalOverview } from "./global-overview-model";

const trip = (id: string, start: string | null, end: string | null, status = "planning") => ({ id, name: `Cesta ${id}`, start_date: start, end_date: end, status, timezone: "Europe/Prague" });
const payment = (id: string, tripId: string, due: string | null, remaining = 100) => ({ balanceDueDate: due, currency: "CZK", href: `/app/trips/${tripId}/budget`, id, name: `Platba ${id}`, remainingAmount: remaining, tripId });

describe("global overview model", () => {
  it("prioritizes an active trip, then the nearest future trip, and ignores archived trips", () => {
    const active = trip("active", "2026-08-01", "2026-08-10", "planning"); const future = trip("future", "2026-08-20", "2026-08-23"); const archived = trip("archived", "2026-08-05", "2026-08-09", "archived");
    expect(buildGlobalOverview({ accommodations: [], budget: [], documents: [], packingItems: [], tasks: [], transports: [], trips: [future, active, archived] } as never, new Date("2026-08-08T12:00:00Z")).dominantTrip?.id).toBe("active");
    expect(buildGlobalOverview({ accommodations: [], budget: [], documents: [], packingItems: [], tasks: [], transports: [], trips: [future, archived] } as never, new Date("2026-08-08T12:00:00Z")).dominantTrip?.id).toBe("future");
  });

  it("puts overdue payments first and excludes paid rows", () => {
    const view = buildGlobalOverview({ accommodations: [], budget: [payment("future", "a", "2026-08-20"), payment("late", "a", "2026-08-01"), payment("paid", "a", "2026-08-02", 0)] as never, documents: [], packingItems: [], tasks: [], transports: [], trips: [trip("a", "2026-08-20", "2026-08-22")] } as never, new Date("2026-08-08T12:00:00Z"));
    expect(view.payments.map((item) => item.id)).toEqual(["late", "future"]);
    expect(view.alerts[0]).toMatchObject({ id: "payment:late", tripId: "a", tripName: "Cesta a", href: "/app/trips/a/budget" });
  });

  it("collects coverage, overdue task and offline-document attention with source links", () => {
    const view = buildGlobalOverview({ accommodations: [{ check_in_date: "2026-08-02", check_out_date: "2026-08-03", id: "stay", trip_id: "a" }, { check_in_date: "2026-08-02", check_out_date: "2026-08-04", id: "stay-two", trip_id: "a" }], budget: [], documents: [{ id: "doc", is_important: true, offline_enabled: false, name: "Pojištění", trip_id: "a" }], packingItems: [], tasks: [{ due_date: "2026-08-01", id: "task", priority: "high", status: "todo", title: "Zaplatit", trip_id: "a" }], transports: [], trips: [trip("a", "2026-08-01", "2026-08-05")] } as never, new Date("2026-08-08T12:00:00Z"));
    expect(view.alerts.map((item) => item.id)).toEqual(expect.arrayContaining(["gap:a", "overlap:a", "task:task", "document:doc"]));
    expect(view.alerts.find((item) => item.id === "document:doc")?.href).toBe("/app/trips/a/documents/doc");
  });

  it("keeps upcoming agenda chronological and limits it to five events", () => {
    const trips = [trip("a", "2026-08-09", "2026-08-10"), trip("b", "2026-08-11", "2026-08-12"), trip("c", "2026-08-13", "2026-08-14")];
    const view = buildGlobalOverview({ accommodations: [], budget: [], documents: [], packingItems: [], tasks: [], transports: [], trips } as never, new Date("2026-08-08T12:00:00Z"));
    expect(view.upcoming).toHaveLength(5); expect(view.upcoming.map((item) => item.date)).toEqual([...view.upcoming.map((item) => item.date)].sort());
  });

  it("derives preparation coverage, checklist completion and separate currency budgets", () => {
    const future = { ...trip("a", "2026-08-10", "2026-08-13"), cities: [], countries: [] };
    const budget = [
      { actualAmount: 700, balanceDueDate: null, currency: "CZK", estimatedAmount: 300, id: "czk", name: "CZK", paidAmount: 0, paymentStatus: "unpaid", remainingAmount: 700, tripId: "a" },
      { actualAmount: 50, balanceDueDate: null, currency: "EUR", estimatedAmount: 50, id: "eur", name: "EUR", paidAmount: 0, paymentStatus: "unpaid", remainingAmount: 50, tripId: "a" },
    ];
    const view = buildGlobalOverview({ accommodations: [{ check_in_date: "2026-08-10", check_out_date: "2026-08-12", trip_id: "a" }], budget, destinations: [], documents: [], packingItems: [], tasks: [{ id: "done", status: "completed", trip_id: "a" }, { id: "todo", status: "todo", trip_id: "a" }], transports: [], travelers: [], trips: [future] } as never, new Date("2026-08-08T12:00:00Z"));
    expect(view.dominantPreparation?.accommodation).toMatchObject({ complete: 2, total: 3, percent: 67 });
    expect(view.dominantPreparation?.checklist).toMatchObject({ complete: 1, total: 2, percent: 50 });
    expect(view.dominantPreparation?.budget.map((item) => item.currency)).toEqual(["CZK", "EUR"]);
    expect(view.dominantPreparation?.budget.map((item) => item.percent)).toEqual([70, 50]);
  });
});
