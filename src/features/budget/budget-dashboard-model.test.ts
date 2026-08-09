import { describe, expect, it } from "vitest";
import type { AccommodationRow, TransportBookingRow, TransportSegmentRow } from "@/lib/supabase/database.types";
import type { TransportBookingWithSegments, TransportSegmentWithPlaces } from "@/features/transport/transport-model";
import type { BudgetPlanItem } from "./budget-domain";
import { buildTripBudgetDashboard } from "./budget-dashboard-model";
import type { Expense } from "./budget-storage-model";

function plan(overrides: Partial<BudgetPlanItem> = {}): BudgetPlanItem {
  return {
    category: "food",
    currency: "CZK",
    id: "food-plan",
    name: "Jídlo",
    plannedAmount: 1000,
    subcategory: null,
    tripId: "trip",
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    amount: 1200,
    category: "food",
    createdAt: "2027-05-01T12:00:00Z",
    createdBy: "user",
    currency: "CZK",
    id: "lunch",
    notes: null,
    occurredAt: "2027-05-01T12:00:00Z",
    paidByTravelerId: null,
    subcategory: "restaurants",
    title: "Oběd",
    tripId: "trip",
    updatedAt: "2027-05-01T12:00:00Z",
    ...overrides,
  };
}

function accommodation(overrides: Partial<AccommodationRow> = {}): AccommodationRow {
  return {
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
    id: "hotel",
    name: "Hotel Nord",
    notes: null,
    paid_amount: 250,
    payment_status: "partially_paid",
    place_id: null,
    room_type: null,
    total_price: 1000,
    trip_id: "trip",
    updated_at: "2027-01-01T00:00:00Z",
    ...overrides,
  };
}

function segment(overrides: Partial<TransportSegmentRow> = {}): TransportSegmentWithPlaces {
  return {
    arrival_at: "2027-06-02T10:00:00Z",
    arrival_place_id: null,
    arrivalPlace: null,
    baggage: null,
    booking_id: "flight",
    created_at: "2027-01-02T00:00:00Z",
    departure_at: "2027-06-02T08:00:00Z",
    departure_place_id: null,
    departurePlace: null,
    id: "segment",
    notes: null,
    platform: null,
    seat: null,
    service_number: null,
    sort_order: 0,
    terminal: null,
    updated_at: "2027-01-02T00:00:00Z",
    ...overrides,
  };
}

function transport(overrides: Partial<TransportBookingRow> = {}): TransportBookingWithSegments {
  return {
    balance_due_date: "2027-06-15",
    booking_reference: null,
    created_at: "2027-01-02T00:00:00Z",
    created_by: "user",
    currency: "EUR",
    id: "flight",
    notes: null,
    paid_amount: 300,
    payment_status: "partially_paid",
    provider: "Airline",
    segments: [segment()],
    status: "booked",
    title: "Let do Osla",
    total_price: 800,
    transport_type: "flight",
    trip_id: "trip",
    updated_at: "2027-01-02T00:00:00Z",
    ...overrides,
  };
}

function dashboard(overrides: Partial<Parameters<typeof buildTripBudgetDashboard>[0]> = {}) {
  return buildTripBudgetDashboard({
    accommodations: [accommodation()],
    expenses: [expense(), expense({ amount: 50, category: "shopping", currency: "EUR", id: "souvenir", subcategory: "souvenirs", title: "Suvenýr" })],
    planItems: [
      plan(),
      plan({ category: "accommodation", currency: "NOK", id: "stay-plan", plannedAmount: 1200, subcategory: "hotel" }),
      plan({ category: "transport", currency: "EUR", id: "flight-plan", plannedAmount: 500, subcategory: "flights" }),
    ],
    today: "2027-06-01",
    transportBookings: [transport()],
    tripCurrency: "CZK",
    tripId: "trip",
    ...overrides,
  });
}

describe("unified trip budget dashboard", () => {
  it("aggregates plan by currency without FX conversion", () => {
    expect(dashboard().plan.totalsByCurrency).toEqual([
      { amount: 1000, currency: "CZK" },
      { amount: 500, currency: "EUR" },
      { amount: 1200, currency: "NOK" },
    ]);
  });

  it("combines manual, accommodation and transport Reality through read-only adapters", () => {
    const reality = dashboard().reality;
    expect(reality.manualExpenses).toEqual(expect.arrayContaining([
      expect.objectContaining({ amount: 1200, editable: true, origin: "manual", sourceId: "lunch" }),
    ]));
    expect(reality.accommodationItems).toEqual([
      expect.objectContaining({ amount: 1000, editable: false, origin: "accommodation", sourceId: "hotel" }),
    ]);
    expect(reality.transportItems).toEqual([
      expect.objectContaining({ amount: 800, editable: false, occurredAt: "2027-06-02T08:00:00Z", origin: "transport", sourceId: "flight" }),
    ]);
    expect(reality.totalsByCurrency).toEqual([
      { amount: 1200, currency: "CZK" },
      { amount: 850, currency: "EUR" },
      { amount: 1000, currency: "NOK" },
    ]);
  });

  it("builds category and currency comparisons with over- and under-budget groups", () => {
    const comparison = dashboard().comparison;
    expect(comparison.byCurrency).toEqual([
      expect.objectContaining({ currency: "CZK", plannedAmount: 1000, realityAmount: 1200, status: "over_budget" }),
      expect.objectContaining({ currency: "EUR", plannedAmount: 500, realityAmount: 850, status: "over_budget" }),
      expect.objectContaining({ currency: "NOK", plannedAmount: 1200, realityAmount: 1000, status: "under_budget" }),
    ]);
    expect(comparison.overBudget).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "food", currency: "CZK" }),
      expect.objectContaining({ category: "transport", currency: "EUR" }),
    ]));
    expect(comparison.underBudget).toEqual([
      expect.objectContaining({ category: "accommodation", currency: "NOK" }),
    ]);
  });

  it("marks Reality without a matching plan in the same category and currency as unplanned", () => {
    expect(dashboard().comparison.unplannedExpenses).toEqual([
      expect.objectContaining({ category: "shopping", currency: "EUR", sourceId: "souvenir" }),
    ]);

    const differentCurrency = dashboard({
      expenses: [expense({ currency: "EUR" })],
      planItems: [plan({ currency: "CZK" })],
      accommodations: [],
      transportBookings: [],
    });
    expect(differentCurrency.comparison.unplannedExpenses).toHaveLength(1);
  });

  it("derives paid and remaining amounts and separates overdue from upcoming payments", () => {
    const payments = dashboard().payments;
    expect(payments.overduePayments).toEqual([
      expect.objectContaining({ dueDate: "2027-05-15", remainingAmount: 750, sourceType: "accommodation" }),
    ]);
    expect(payments.upcomingPayments).toEqual([
      expect.objectContaining({ dueDate: "2027-06-15", remainingAmount: 500, sourceType: "transport" }),
    ]);
    expect(payments.paidAmountsByCurrency).toEqual([
      { amount: 300, currency: "EUR" },
      { amount: 250, currency: "NOK" },
    ]);
    expect(payments.remainingAmountsByCurrency).toEqual([
      { amount: 500, currency: "EUR" },
      { amount: 750, currency: "NOK" },
    ]);
  });

  it("does not include fully paid sources among pending payments", () => {
    const result = dashboard({
      accommodations: [],
      expenses: [],
      planItems: [],
      transportBookings: [transport({ balance_due_date: "2027-05-01", paid_amount: 800, payment_status: "paid" })],
    });
    expect(result.payments.overduePayments).toEqual([]);
    expect(result.payments.upcomingPayments).toEqual([]);
    expect(result.payments.remainingAmountsByCurrency).toEqual([]);
    expect(result.payments.paidAmountsByCurrency).toEqual([{ amount: 800, currency: "EUR" }]);
  });
});
