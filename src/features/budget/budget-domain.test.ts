import { describe, expect, it } from "vitest";
import type { AccommodationRow, TransportBookingRow } from "@/lib/supabase/database.types";
import {
  buildBudgetDashboardSummary,
  calculateBudgetComparison,
  createQuickExpenseInput,
  groupBudgetByCurrency,
  mapAccommodationToPayment,
  mapAccommodationToReality,
  mapManualExpenseToPayment,
  mapManualExpenseToReality,
  mapTransportToPayment,
  mapTransportToReality,
  matchBudgetPlanItem,
  summarizeBudgetPayments,
  type BudgetPlanItem,
  type BudgetRealityItem,
  type ManualExpenseSource,
} from "./budget-domain";

const accommodation = {
  accommodation_type: "hotel",
  balance_due_date: "2027-05-15",
  booking_reference: null,
  booking_url: null,
  breakfast_included: null,
  check_in_date: "2027-06-01",
  check_in_time: null,
  check_out_date: "2027-06-04",
  check_out_time: null,
  created_at: "2027-01-01T00:00:00Z",
  created_by: "user",
  currency: "NOK",
  guest_count: null,
  id: "stay",
  name: "Hotel Nord",
  notes: null,
  paid_amount: 250,
  payment_status: "partially_paid",
  place_id: null,
  room_type: null,
  total_price: 1000,
  trip_id: "trip",
  updated_at: "2027-01-01T00:00:00Z",
} satisfies AccommodationRow;

const transport = {
  balance_due_date: null,
  booking_reference: null,
  created_at: "2027-01-02T00:00:00Z",
  created_by: "user",
  currency: "EUR",
  id: "flight",
  notes: null,
  paid_amount: 800,
  payment_status: "paid",
  provider: "Airline",
  status: "booked",
  title: "Let do Osla",
  total_price: 800,
  transport_type: "flight",
  trip_id: "trip",
  updated_at: "2027-01-02T00:00:00Z",
} satisfies TransportBookingRow;

const manualExpense = {
  amount: 1200,
  category: "food",
  currency: "CZK",
  dueDate: "2027-05-01",
  id: "restaurant",
  note: null,
  occurredAt: "2027-04-20T18:00:00Z",
  paidAmount: 200,
  paymentStatus: "partially_paid",
  subcategory: "restaurants",
  title: "Večeře",
  tripId: "trip",
} satisfies ManualExpenseSource;

function plan(overrides: Partial<BudgetPlanItem> = {}): BudgetPlanItem {
  return {
    category: "food",
    currency: "CZK",
    id: "food-plan",
    name: "Jídlo",
    plannedAmount: 10_000,
    subcategory: null,
    tripId: "trip",
    ...overrides,
  };
}

function reality(overrides: Partial<BudgetRealityItem> = {}): BudgetRealityItem {
  return {
    amount: 1200,
    category: "food",
    currency: "CZK",
    editable: true,
    id: "expense",
    occurredAt: "2027-04-20T18:00:00Z",
    origin: "manual",
    sourceId: "expense",
    subcategory: "restaurants",
    title: "Restaurace",
    tripId: "trip",
    ...overrides,
  };
}

describe("budget domain comparison", () => {
  it("distinguishes under and over budget", () => {
    expect(calculateBudgetComparison(10_000, 7_000)).toEqual({
      difference: 3000,
      percentage: 70,
      plannedAmount: 10_000,
      realityAmount: 7_000,
      status: "under_budget",
    });
    expect(calculateBudgetComparison(10_000, 12_000)).toEqual({
      difference: -2000,
      percentage: 120,
      plannedAmount: 10_000,
      realityAmount: 12_000,
      status: "over_budget",
    });
  });

  it("treats missing and zero plan safely without dividing by zero", () => {
    expect(calculateBudgetComparison(0, 7000)).toMatchObject({ percentage: null, status: "no_plan" });
    expect(calculateBudgetComparison(0, 0)).toMatchObject({ difference: 0, percentage: null, status: "no_plan" });
  });
});

describe("budget category matching", () => {
  it("prefers an exact subcategory over a category envelope", () => {
    const match = matchBudgetPlanItem([
      plan(),
      plan({ id: "restaurants", subcategory: "restaurants" }),
    ], reality());
    expect(match).toMatchObject({ match: "subcategory", planItem: { id: "restaurants" } });
  });

  it("falls back to a category envelope and does not cross trips", () => {
    expect(matchBudgetPlanItem([plan()], reality({ subcategory: "cafes" }))).toMatchObject({
      match: "category",
      planItem: { id: "food-plan" },
    });
    expect(matchBudgetPlanItem([plan({ tripId: "other" })], reality())).toBeNull();
  });
});

describe("budget currencies", () => {
  it("keeps CZK and EUR totals separate", () => {
    expect(groupBudgetByCurrency([
      plan(),
      plan({ currency: "EUR", id: "eur-plan", plannedAmount: 500 }),
    ], [
      reality(),
      reality({ amount: 600, currency: "EUR", id: "eur-expense" }),
    ])).toEqual([
      expect.objectContaining({ currency: "CZK", plannedAmount: 10_000, realityAmount: 1200 }),
      expect.objectContaining({ currency: "EUR", plannedAmount: 500, realityAmount: 600 }),
    ]);
  });
});

describe("budget reality and payment adapters", () => {
  it("maps accommodation and transport without copying or making them editable", () => {
    expect(mapAccommodationToReality(accommodation, "CZK")).toMatchObject({
      amount: 1000, category: "accommodation", editable: false, occurredAt: "2027-06-01", origin: "accommodation", sourceId: "stay", subcategory: "hotel",
    });
    expect(mapTransportToReality({ ...transport, segments: [{ departure_at: "2027-06-02T08:00:00Z" }] }, "CZK")).toMatchObject({
      amount: 800, category: "transport", editable: false, occurredAt: "2027-06-02T08:00:00Z", origin: "transport", sourceId: "flight", subcategory: "flights",
    });
  });

  it("maps a manual expense as editable reality", () => {
    expect(mapManualExpenseToReality(manualExpense)).toMatchObject({
      amount: 1200, editable: true, origin: "manual", sourceId: "restaurant", subcategory: "restaurants",
    });
  });

  it("keeps Reality independent from paid and remaining amounts", () => {
    const realityItem = mapAccommodationToReality(accommodation, "CZK");
    const payment = mapAccommodationToPayment(accommodation, "CZK");
    expect(realityItem?.amount).toBe(1000);
    expect(payment).toMatchObject({ amount: 1000, paidAmount: 250, remainingAmount: 750 });
    expect(mapTransportToPayment(transport, "CZK")).toMatchObject({ paidAmount: 800, remainingAmount: 0 });
    expect(mapManualExpenseToPayment(manualExpense)).toMatchObject({ paidAmount: 200, remainingAmount: 1000 });
  });
});

describe("budget payments and dashboard summary", () => {
  it("separates overdue, upcoming, paid and remaining payments", () => {
    const overdue = mapManualExpenseToPayment(manualExpense);
    const upcoming = { ...overdue, dueDate: "2027-06-15", id: "upcoming", paidAmount: 1200, remainingAmount: 300 };
    const paid = { ...overdue, dueDate: null, id: "paid", paidAmount: 500, remainingAmount: 0 };
    const summary = summarizeBudgetPayments([upcoming, paid, overdue], "2027-06-01");
    expect(summary.overduePayments.map((item) => item.id)).toEqual(["manual:restaurant"]);
    expect(summary.upcomingPayments.map((item) => item.id)).toEqual(["upcoming"]);
    expect(summary.totalDue).toEqual([{ amount: 1300, currency: "CZK" }]);
    expect(summary.totalPaid).toEqual([{ amount: 1900, currency: "CZK" }]);
  });

  it("builds a dashboard contract with Plan, Reality, comparison and Payments", () => {
    const summary = buildBudgetDashboardSummary([plan()], [reality()], [mapManualExpenseToPayment(manualExpense)], "2027-06-01");
    expect(summary.planSummary).toEqual([{ amount: 10_000, currency: "CZK" }]);
    expect(summary.realitySummary).toEqual([{ amount: 1200, currency: "CZK" }]);
    expect(summary.comparison[0]).toMatchObject({ difference: 8800, status: "under_budget" });
    expect(summary.paymentsSummary.totalDue).toEqual([{ amount: 1000, currency: "CZK" }]);
  });
});

describe("quick expense contract", () => {
  it("accepts the minimum amount and category with automatic context", () => {
    expect(createQuickExpenseInput({ amount: 350, category: "food" }, {
      createdBy: "user",
      currency: "czk",
      occurredAt: "2027-06-01T12:00:00Z",
      tripId: "trip",
    })).toEqual({
      amount: 350,
      category: "food",
      createdBy: "user",
      currency: "CZK",
      note: null,
      occurredAt: "2027-06-01T12:00:00Z",
      subcategory: null,
      title: null,
      tripId: "trip",
    });
  });

  it("rejects a non-positive amount and a subcategory from another category", () => {
    const context = { createdBy: "user", currency: "CZK", occurredAt: "2027-06-01T12:00:00Z", tripId: "trip" };
    expect(createQuickExpenseInput({ amount: 0, category: "food" }, context)).toBeNull();
    expect(createQuickExpenseInput({ amount: 100, category: "food", subcategory: "fuel" }, context)).toBeNull();
  });
});
