import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccommodationRow, TransportBookingRow, TransportSegmentRow } from "@/lib/supabase/database.types";
import type { TransportBookingWithSegments, TransportSegmentWithPlaces } from "@/features/transport/transport-model";
import type { BudgetPlanItem } from "./budget-domain";
import { buildTripBudgetDashboard } from "./budget-dashboard-model";
import type { Expense } from "./budget-storage-model";

vi.mock("./budget-expense-actions", () => ({
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  updateExpense: vi.fn(),
}));

import { BudgetRealitySection, groupExpensesByDate } from "./budget-reality-section";

afterEach(cleanup);

function plan(overrides: Partial<BudgetPlanItem> = {}): BudgetPlanItem {
  return {
    category: "food",
    currency: "CZK",
    id: "food-plan",
    name: "Jídlo",
    notes: null,
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
    createdAt: "2027-06-01T12:00:00Z",
    createdBy: "user",
    currency: "CZK",
    id: "lunch",
    notes: "Oběd během výletu",
    occurredAt: "2027-06-01T12:00:00Z",
    paidByTravelerId: null,
    subcategory: "restaurants",
    title: "Oběd",
    tripId: "trip",
    updatedAt: "2027-06-01T12:00:00Z",
    ...overrides,
  };
}

function accommodation(overrides: Partial<AccommodationRow> = {}): AccommodationRow {
  return {
    accommodation_type: "hotel",
    balance_due_date: null,
    booking_reference: null,
    booking_url: null,
    breakfast_included: null,
    check_in_date: "2027-06-03",
    check_in_time: null,
    check_out_date: "2027-06-05",
    check_out_time: null,
    created_at: "2027-01-01T00:00:00Z",
    created_by: "user",
    currency: "NOK",
    guest_count: null,
    id: "hotel",
    name: "Hotel Nord",
    notes: null,
    paid_amount: 1000,
    payment_status: "paid",
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
    expenses: [expense(), expense({ amount: 300, id: "yesterday", occurredAt: "2027-05-31T09:00:00Z", title: null })],
    planItems: [
      plan(),
      plan({ category: "accommodation", currency: "NOK", id: "hotel-plan", plannedAmount: 1200, subcategory: "hotel" }),
      plan({ category: "transport", currency: "EUR", id: "flight-plan", plannedAmount: 500, subcategory: "flights" }),
    ],
    today: "2027-06-01",
    transportBookings: [transport()],
    tripCurrency: "CZK",
    tripId: "trip",
    ...overrides,
  });
}

function reality(overrides: { canEdit?: boolean; dashboard?: ReturnType<typeof dashboard> } = {}) {
  const model = overrides.dashboard ?? dashboard();
  return <BudgetRealitySection
    canEdit={overrides.canEdit ?? true}
    comparison={model.comparison}
    reality={model.reality}
    today="2027-06-01"
    tripCurrency="CZK"
    tripId="trip"
  />;
}

describe("Budget Reality UI", () => {
  it("opens the quick expense form with amount and category as the required first fields", () => {
    render(reality());
    fireEvent.click(screen.getAllByRole("button", { name: "Výdaj" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Nový výdaj" });
    expect(within(dialog).getByRole("textbox", { name: /Částka/i })).toBeRequired();
    expect(within(dialog).getByRole("combobox", { name: "Kategorie" })).toBeRequired();
    expect(within(dialog).getByText("CZK")).toBeInTheDocument();
  });

  it("groups manual expenses into today and yesterday and exposes edit only to editors", () => {
    const { rerender } = render(reality());
    expect(screen.getByRole("heading", { name: "Dnes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Včera" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Upravit" })).toHaveLength(2);

    rerender(reality({ canEdit: false }));
    expect(screen.queryByRole("button", { name: "Výdaj" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upravit" })).not.toBeInTheDocument();
  });

  it("renders Accommodation and Transport as read-only costs linked to their sources", () => {
    render(reality());
    expect(screen.getByText("Hotel Nord")).toBeInTheDocument();
    expect(screen.getByText("Let do Osla")).toBeInTheDocument();
    const sourceLinks = screen.getAllByRole("link", { name: /Zdroj/ });
    expect(sourceLinks[0]).toHaveAttribute("href", "/app/trips/trip/accommodation?edit=hotel");
    expect(sourceLinks[1]).toHaveAttribute("href", "/app/trips/trip/transport?edit=flight");
    expect(screen.getAllByText(/pouze pro čtení/i)).toHaveLength(2);
  });

  it("shows category comparison, over-budget state and currencies without FX total", () => {
    render(reality());
    expect(screen.getAllByText("Překročeno").length).toBeGreaterThan(0);
    expect(screen.getByText("150 % plánu")).toBeInTheDocument();
    expect(screen.getByText(/Bez FX kurzu nevzniká společný total/)).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("NOK")).toBeInTheDocument();
  });

  it("provides deterministic timeline grouping for older dates", () => {
    const groups = groupExpensesByDate([
      dashboard().reality.manualExpenses[0]!,
      { ...dashboard().reality.manualExpenses[0]!, id: "older", occurredAt: "2027-05-20T08:00:00Z" },
    ], "2027-06-01");
    expect(groups.map((group) => group.date)).toEqual(["2027-06-01", "2027-05-20"]);
    expect(groups[1]?.label).toMatch(/20.*května.*2027/i);
  });
});
