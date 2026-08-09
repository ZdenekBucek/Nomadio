import type { AccommodationRow, BudgetCategory } from "@/lib/supabase/database.types";
import type { TransportBookingWithSegments } from "@/features/transport/transport-model";
import {
  calculateBudgetComparison,
  groupBudgetByCurrency,
  mapAccommodationToPayment,
  mapAccommodationToReality,
  mapTransportToPayment,
  mapTransportToReality,
  matchBudgetPlanItem,
  normalizeBudgetCurrency,
  summarizeBudgetAmounts,
  summarizeBudgetPayments,
  type BudgetComparison,
  type BudgetCurrencyAmount,
  type BudgetCurrencyGroup,
  type BudgetManualExpenseItem,
  type BudgetPaymentItem,
  type BudgetPlanItem,
  type BudgetRealityItem,
} from "./budget-domain";
import { mapExpenseToReality, type Expense } from "./budget-storage-model";

export type BudgetCategoryComparison = BudgetComparison & {
  category: BudgetCategory;
  currency: string;
};

export type TripBudgetDashboard = {
  comparison: {
    byCategory: BudgetCategoryComparison[];
    byCurrency: BudgetCurrencyGroup[];
    overBudget: BudgetCategoryComparison[];
    underBudget: BudgetCategoryComparison[];
    unplannedExpenses: BudgetRealityItem[];
  };
  payments: {
    items: BudgetPaymentItem[];
    overduePayments: BudgetPaymentItem[];
    paidAmountsByCurrency: BudgetCurrencyAmount[];
    remainingAmountsByCurrency: BudgetCurrencyAmount[];
    upcomingPayments: BudgetPaymentItem[];
  };
  plan: {
    items: BudgetPlanItem[];
    totalsByCurrency: BudgetCurrencyAmount[];
  };
  reality: {
    accommodationItems: BudgetRealityItem[];
    items: BudgetRealityItem[];
    manualExpenses: BudgetManualExpenseItem[];
    totalsByCurrency: BudgetCurrencyAmount[];
    transportItems: BudgetRealityItem[];
  };
  tripId: string;
};

export type TripBudgetDashboardSources = {
  accommodations: AccommodationRow[];
  expenses: Expense[];
  planItems: BudgetPlanItem[];
  today: string;
  transportBookings: TransportBookingWithSegments[];
  tripCurrency: string;
  tripId: string;
};

function categoryComparisons(plan: BudgetPlanItem[], reality: BudgetRealityItem[]): BudgetCategoryComparison[] {
  const keys = new Map<string, { category: BudgetCategory; currency: string }>();
  for (const item of [...plan, ...reality]) {
    const currency = normalizeBudgetCurrency(item.currency);
    keys.set(`${currency}:${item.category}`, { category: item.category, currency });
  }

  return [...keys.values()]
    .sort((left, right) => left.currency.localeCompare(right.currency) || left.category.localeCompare(right.category))
    .map(({ category, currency }) => ({
      category,
      currency,
      ...calculateBudgetComparison(
        plan
          .filter((item) => item.category === category && normalizeBudgetCurrency(item.currency) === currency)
          .reduce((sum, item) => sum + item.plannedAmount, 0),
        reality
          .filter((item) => item.category === category && normalizeBudgetCurrency(item.currency) === currency)
          .reduce((sum, item) => sum + item.amount, 0),
      ),
    }));
}

export function buildTripBudgetDashboard(sources: TripBudgetDashboardSources): TripBudgetDashboard {
  const manualExpenses = sources.expenses.map(mapExpenseToReality);
  const accommodationItems = sources.accommodations
    .map((item) => mapAccommodationToReality(item, sources.tripCurrency))
    .filter((item): item is BudgetRealityItem => item !== null);
  const transportItems = sources.transportBookings
    .map((item) => mapTransportToReality(item, sources.tripCurrency))
    .filter((item): item is BudgetRealityItem => item !== null);
  const realityItems = [...manualExpenses, ...accommodationItems, ...transportItems]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || left.id.localeCompare(right.id));

  const paymentItems = [
    ...sources.accommodations.map((item) => mapAccommodationToPayment(item, sources.tripCurrency)),
    ...sources.transportBookings.map((item) => mapTransportToPayment(item, sources.tripCurrency)),
  ].filter((item): item is BudgetPaymentItem => item !== null);
  const paymentSummary = summarizeBudgetPayments(paymentItems, sources.today);
  const byCategory = categoryComparisons(sources.planItems, realityItems);

  return {
    comparison: {
      byCategory,
      byCurrency: groupBudgetByCurrency(sources.planItems, realityItems),
      overBudget: byCategory.filter((item) => item.status === "over_budget"),
      underBudget: byCategory.filter((item) => item.status === "under_budget"),
      unplannedExpenses: realityItems.filter((item) => matchBudgetPlanItem(sources.planItems, item) === null),
    },
    payments: {
      items: paymentItems,
      overduePayments: paymentSummary.overduePayments,
      paidAmountsByCurrency: paymentSummary.totalPaid,
      remainingAmountsByCurrency: paymentSummary.totalDue,
      upcomingPayments: paymentSummary.upcomingPayments,
    },
    plan: {
      items: sources.planItems,
      totalsByCurrency: summarizeBudgetAmounts(sources.planItems.map((item) => ({
        amount: item.plannedAmount,
        currency: item.currency,
      }))),
    },
    reality: {
      accommodationItems,
      items: realityItems,
      manualExpenses,
      totalsByCurrency: summarizeBudgetAmounts(realityItems),
      transportItems,
    },
    tripId: sources.tripId,
  };
}
