import { describe, expect, it } from "vitest";
import type { TripBudgetDashboard } from "@/features/budget/budget-dashboard-model";
import type { BudgetPaymentItem } from "@/features/budget/budget-domain";
import { buildTripOverview } from "./overview-model";

function payment(overrides: Partial<BudgetPaymentItem> = {}): BudgetPaymentItem {
  return {
    amount: 700,
    currency: "CZK",
    dueDate: "2020-01-01",
    id: "accommodation:hotel",
    paidAmount: 200,
    paymentStatus: "partially_paid",
    remainingAmount: 500,
    sourceId: "hotel",
    sourceType: "accommodation",
    title: "Hotel",
    tripId: "trip",
    ...overrides,
  };
}

function budgetDashboard(overrides: Partial<TripBudgetDashboard> = {}): TripBudgetDashboard {
  const overdue = payment();
  return {
    comparison: {
      byCategory: [],
      byCurrency: [{ currency: "CZK", difference: 300, percentage: 70, plannedAmount: 1000, realityAmount: 700, status: "under_budget" }],
      overBudget: [],
      underBudget: [],
      unplannedExpenses: [],
    },
    payments: {
      items: [overdue],
      overduePayments: [overdue],
      paidAmountsByCurrency: [{ amount: 200, currency: "CZK" }],
      remainingAmountsByCurrency: [{ amount: 500, currency: "CZK" }],
      upcomingPayments: [],
    },
    plan: { items: [], totalsByCurrency: [{ amount: 1000, currency: "CZK" }] },
    reality: { accommodationItems: [], items: [], manualExpenses: [], totalsByCurrency: [{ amount: 700, currency: "CZK" }], transportItems: [] },
    tripId: "trip",
    ...overrides,
  };
}

function overviewInput(dashboard = budgetDashboard()) {
  return {
    accommodations: [],
    budgetDashboard: dashboard,
    documents: [],
    itineraryDays: [],
    itineraryItems: [],
    packingItems: [],
    tasks: [],
    transport: [],
    timezone: "Europe/Prague",
    tripEnd: "2026-08-15",
    tripId: "trip",
    tripStart: "2026-08-14",
  };
}

describe("buildTripOverview", () => {
  it("keeps plan, reality, remaining budget and remaining payment distinct", () => {
    const view = buildTripOverview(overviewInput());

    expect(view.finance).toEqual([{
      currency: "CZK",
      paidAmount: 200,
      planAmount: 1000,
      realityAmount: 700,
      remainingBudget: 300,
      remainingPayment: 500,
    }]);
  });

  it("keeps currencies separate and prioritizes an overdue payment from the Budget read model", () => {
    const future = payment({ currency: "EUR", dueDate: "2099-01-01", id: "transport:train", remainingAmount: 12, sourceId: "train", sourceType: "transport", title: "Train" });
    const dashboard = budgetDashboard({
      comparison: {
        byCategory: [],
        byCurrency: [
          { currency: "CZK", difference: 300, percentage: 70, plannedAmount: 1000, realityAmount: 700, status: "under_budget" },
          { currency: "EUR", difference: 88, percentage: 12, plannedAmount: 100, realityAmount: 12, status: "under_budget" },
        ],
        overBudget: [], underBudget: [], unplannedExpenses: [],
      },
      payments: {
        ...budgetDashboard().payments,
        items: [payment(), future],
        remainingAmountsByCurrency: [{ amount: 500, currency: "CZK" }, { amount: 12, currency: "EUR" }],
        upcomingPayments: [future],
      },
    });
    const view = buildTripOverview(overviewInput(dashboard));

    expect(view.finance.map((item) => item.currency)).toEqual(["CZK", "EUR"]);
    expect(view.nearestPayment?.id).toBe("accommodation:hotel");
    expect(view.alerts[0]?.id).toBe("payment:accommodation:hotel");
  });

  it("does not count an undated itinerary template as a planned trip day", () => {
    const view = buildTripOverview({
      ...overviewInput(),
      itineraryDays: [{ day_date: null, id: "template" }, { day_date: "2026-08-14", id: "day" }] as never,
      itineraryItems: [{ day_id: "template" }, { day_id: "day" }] as never,
    });
    expect(view.itinerary).toMatchObject({ plannedDays: 1, totalDays: 1 });
  });
});
