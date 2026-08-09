import { describe, expect, it } from "vitest";
import type { TripBudgetDashboard } from "@/features/budget/budget-dashboard-model";
import type { BudgetCurrencyAmount, BudgetPaymentItem } from "@/features/budget/budget-domain";
import { buildGlobalOverview } from "./global-overview-model";

const trip = (id: string, start: string | null, end: string | null, status = "planning") => ({ id, name: `Cesta ${id}`, start_date: start, end_date: end, status, timezone: "Europe/Prague" });

function payment(id: string, tripId: string, dueDate: string | null, remainingAmount = 100): BudgetPaymentItem {
  return { amount: 500, currency: "CZK", dueDate, id, paidAmount: 500 - remainingAmount, paymentStatus: remainingAmount ? "partially_paid" : "paid", remainingAmount, sourceId: id, sourceType: "accommodation", title: `Platba ${id}`, tripId };
}

function dashboard(tripId: string, reality: BudgetCurrencyAmount[] = [], overduePayments: BudgetPaymentItem[] = [], upcomingPayments: BudgetPaymentItem[] = []): TripBudgetDashboard {
  return {
    comparison: { byCategory: [], byCurrency: [], overBudget: [], underBudget: [], unplannedExpenses: [] },
    payments: { items: [...overduePayments, ...upcomingPayments], overduePayments, paidAmountsByCurrency: [], remainingAmountsByCurrency: [], upcomingPayments },
    plan: { items: [], totalsByCurrency: [] },
    reality: { accommodationItems: [], items: [], manualExpenses: [], totalsByCurrency: reality, transportItems: [] },
    tripId,
  };
}

function sources(overrides: Record<string, unknown> = {}) {
  return { accommodations: [], budgetDashboards: [], destinations: [], documents: [], packingItems: [], tasks: [], transports: [], travelers: [], trips: [], ...overrides } as never;
}

describe("global overview model", () => {
  it("prioritizes an active trip, then the nearest future trip, and ignores archived trips", () => {
    const active = trip("active", "2026-08-01", "2026-08-10", "planning"); const future = trip("future", "2026-08-20", "2026-08-23"); const archived = trip("archived", "2026-08-05", "2026-08-09", "archived");
    expect(buildGlobalOverview(sources({ trips: [future, active, archived] }), new Date("2026-08-08T12:00:00Z")).dominantTrip?.id).toBe("active");
    expect(buildGlobalOverview(sources({ trips: [future, archived] }), new Date("2026-08-08T12:00:00Z")).dominantTrip?.id).toBe("future");
  });

  it("combines payments from multiple trips, puts overdue first and keeps only remaining obligations", () => {
    const late = payment("late", "a", "2026-08-01");
    const future = payment("future", "b", "2026-08-20");
    const paid = payment("paid", "b", "2026-08-02", 0);
    const view = buildGlobalOverview(sources({
      budgetDashboards: [dashboard("a", [], [late]), { ...dashboard("b", [], [], [future]), payments: { ...dashboard("b").payments, items: [future, paid], upcomingPayments: [future] } }],
      trips: [trip("a", "2026-08-20", "2026-08-22"), trip("b", "2026-09-01", "2026-09-03")],
    }), new Date("2026-08-08T12:00:00Z"));

    expect(view.payments.map((item) => item.id)).toEqual(["late", "future"]);
    expect(view.payments[0]).toMatchObject({ isOverdue: true, remainingAmount: 100, tripName: "Cesta a" });
    expect(view.alerts[0]).toMatchObject({ id: "payment:late", tripId: "a", href: "/app/trips/a/accommodation?edit=late" });
  });

  it("aggregates reality across trips per currency without creating a false FX total", () => {
    const view = buildGlobalOverview(sources({
      budgetDashboards: [
        dashboard("a", [{ amount: 30000, currency: "CZK" }, { amount: 200, currency: "EUR" }]),
        dashboard("b", [{ amount: 20000, currency: "CZK" }, { amount: 300, currency: "EUR" }]),
      ],
      trips: [trip("a", "2026-08-20", "2026-08-22"), trip("b", "2026-09-01", "2026-09-03")],
    }), new Date("2026-08-08T12:00:00Z"));

    expect(view.financeReality).toEqual([{ amount: 50000, currency: "CZK" }, { amount: 500, currency: "EUR" }]);
    expect(view.financeReality).toHaveLength(2);
  });

  it("collects coverage, overdue task and offline-document attention with source links", () => {
    const view = buildGlobalOverview(sources({ accommodations: [{ check_in_date: "2026-08-02", check_out_date: "2026-08-03", id: "stay", trip_id: "a" }, { check_in_date: "2026-08-02", check_out_date: "2026-08-04", id: "stay-two", trip_id: "a" }], documents: [{ id: "doc", is_important: true, offline_enabled: false, name: "Pojištění", trip_id: "a" }], tasks: [{ due_date: "2026-08-01", id: "task", priority: "high", status: "todo", title: "Zaplatit", trip_id: "a" }], trips: [trip("a", "2026-08-01", "2026-08-05")] }), new Date("2026-08-08T12:00:00Z"));
    expect(view.alerts.map((item) => item.id)).toEqual(expect.arrayContaining(["gap:a", "overlap:a", "task:task", "document:doc"]));
    expect(view.alerts.find((item) => item.id === "document:doc")?.href).toBe("/app/trips/a/documents/doc");
  });

  it("keeps upcoming agenda chronological and limits it to five events", () => {
    const trips = [trip("a", "2026-08-09", "2026-08-10"), trip("b", "2026-08-11", "2026-08-12"), trip("c", "2026-08-13", "2026-08-14")];
    const view = buildGlobalOverview(sources({ trips }), new Date("2026-08-08T12:00:00Z"));
    expect(view.upcoming).toHaveLength(5); expect(view.upcoming.map((item) => item.date)).toEqual([...view.upcoming.map((item) => item.date)].sort());
  });

  it("derives preparation coverage and checklist completion without legacy Budget detail", () => {
    const future = { ...trip("a", "2026-08-10", "2026-08-13"), cities: [], countries: [] };
    const view = buildGlobalOverview(sources({ accommodations: [{ check_in_date: "2026-08-10", check_out_date: "2026-08-12", trip_id: "a" }], tasks: [{ id: "done", status: "completed", trip_id: "a" }, { id: "todo", status: "todo", trip_id: "a" }], trips: [future] }), new Date("2026-08-08T12:00:00Z"));
    expect(view.dominantPreparation?.accommodation).toMatchObject({ complete: 2, total: 3, percent: 67 });
    expect(view.dominantPreparation?.checklist).toMatchObject({ complete: 1, total: 2, percent: 50 });
    expect(view.dominantPreparation).not.toHaveProperty("budget");
  });
});
