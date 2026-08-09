import type {
  AccommodationRow,
  BudgetCategory,
  BudgetPaymentStatus,
  BudgetSubcategory,
  TransportBookingRow,
  TransportSegmentRow,
} from "@/lib/supabase/database.types";
import {
  accommodationBudgetClassification,
  budgetCategories,
  budgetCategoryLabels,
  isSubcategoryForCategory,
  transportBudgetClassification,
} from "./budget-categories";

export type BudgetPlanItem = {
  category: BudgetCategory;
  currency: string;
  id: string;
  name: string;
  notes: string | null;
  plannedAmount: number;
  subcategory: BudgetSubcategory | null;
  tripId: string;
};

export type BudgetRealityOrigin = "manual" | "accommodation" | "transport";

export type BudgetRealityItem = {
  amount: number;
  category: BudgetCategory;
  currency: string;
  editable: boolean;
  id: string;
  occurredAt: string;
  origin: BudgetRealityOrigin;
  sourceId: string | null;
  subcategory: BudgetSubcategory | null;
  title: string;
  tripId: string;
};

export type BudgetManualExpenseItem = BudgetRealityItem & {
  enteredTitle: string | null;
  notes: string | null;
  paidByTravelerId: string | null;
};

export type BudgetPaymentSourceType = BudgetRealityOrigin;

export type BudgetPaymentItem = {
  amount: number;
  currency: string;
  dueDate: string | null;
  id: string;
  paidAmount: number | null;
  paymentStatus: BudgetPaymentStatus;
  remainingAmount: number | null;
  sourceId: string;
  sourceType: BudgetPaymentSourceType;
  title: string;
  tripId: string;
};

export type BudgetComparisonStatus = "under_budget" | "on_budget" | "over_budget" | "no_plan";

export type BudgetComparison = {
  difference: number;
  percentage: number | null;
  plannedAmount: number;
  realityAmount: number;
  status: BudgetComparisonStatus;
};

export type BudgetPlanMatch = {
  match: "category" | "subcategory";
  planItem: BudgetPlanItem;
};

export type BudgetCurrencyAmount = {
  amount: number;
  currency: string;
};

export type BudgetCurrencyGroup = BudgetComparison & {
  currency: string;
};

export type BudgetPaymentsSummary = {
  overduePayments: BudgetPaymentItem[];
  totalDue: BudgetCurrencyAmount[];
  totalPaid: BudgetCurrencyAmount[];
  upcomingPayments: BudgetPaymentItem[];
};

export type BudgetDashboardSummary = {
  comparison: BudgetCurrencyGroup[];
  paymentsSummary: BudgetPaymentsSummary;
  planSummary: BudgetCurrencyAmount[];
  realitySummary: BudgetCurrencyAmount[];
};

export type ManualExpenseSource = {
  amount: number;
  category: BudgetCategory;
  currency: string;
  dueDate: string | null;
  id: string;
  note: string | null;
  occurredAt: string;
  paidAmount: number | null;
  paymentStatus: BudgetPaymentStatus;
  subcategory: BudgetSubcategory | null;
  title: string;
  tripId: string;
};

export type QuickExpenseDraft = {
  amount: number;
  category: BudgetCategory;
  note?: string | null;
  subcategory?: BudgetSubcategory | null;
  title?: string | null;
};

export type QuickExpenseContext = {
  createdBy: string;
  currency: string;
  occurredAt: string;
  tripId: string;
};

export type QuickExpenseInput = {
  amount: number;
  category: BudgetCategory;
  createdBy: string;
  currency: string;
  note: string | null;
  occurredAt: string;
  subcategory: BudgetSubcategory | null;
  title: string | null;
  tripId: string;
};

type TransportRealitySource = TransportBookingRow & {
  segments?: Pick<TransportSegmentRow, "departure_at">[];
};

const amountPrecision = 100;

function rounded(value: number) {
  return Math.round((value + Number.EPSILON) * amountPrecision) / amountPrecision;
}

export function normalizeBudgetCurrency(value: string) {
  return value.trim().toUpperCase();
}

function knownPaymentAmount(amount: number, paidAmount: number | null, status: BudgetPaymentStatus) {
  if (paidAmount !== null) return paidAmount >= 0 && paidAmount <= amount ? paidAmount : null;
  if (status === "paid") return amount;
  if (status === "unpaid" || status === "pay_on_site") return 0;
  return null;
}

function createPaymentItem(input: Omit<BudgetPaymentItem, "paidAmount" | "remainingAmount"> & { paidAmount: number | null }) {
  const paidAmount = knownPaymentAmount(input.amount, input.paidAmount, input.paymentStatus);
  return {
    ...input,
    paidAmount,
    remainingAmount: paidAmount === null ? null : rounded(input.amount - paidAmount),
  } satisfies BudgetPaymentItem;
}

export function calculateBudgetComparison(plannedAmount: number, realityAmount: number): BudgetComparison {
  const planned = rounded(Math.max(0, plannedAmount));
  const reality = rounded(Math.max(0, realityAmount));
  const difference = rounded(planned - reality);
  if (planned === 0) {
    return { difference, percentage: null, plannedAmount: planned, realityAmount: reality, status: "no_plan" };
  }
  return {
    difference,
    percentage: rounded((reality / planned) * 100),
    plannedAmount: planned,
    realityAmount: reality,
    status: difference > 0 ? "under_budget" : difference < 0 ? "over_budget" : "on_budget",
  };
}

export function matchBudgetPlanItem(plan: BudgetPlanItem[], reality: BudgetRealityItem): BudgetPlanMatch | null {
  const realityCurrency = normalizeBudgetCurrency(reality.currency);
  const candidates = plan.filter((item) =>
    item.tripId === reality.tripId
    && item.category === reality.category
    && normalizeBudgetCurrency(item.currency) === realityCurrency,
  );
  if (reality.subcategory) {
    const exact = candidates.find((item) => item.subcategory === reality.subcategory);
    if (exact) return { match: "subcategory", planItem: exact };
  }
  const categoryEnvelope = candidates.find((item) => item.subcategory === null);
  return categoryEnvelope ? { match: "category", planItem: categoryEnvelope } : null;
}

export function summarizeBudgetAmounts(items: Array<{ amount: number; currency: string }>): BudgetCurrencyAmount[] {
  const grouped = new Map<string, number>();
  for (const item of items) {
    const currency = normalizeBudgetCurrency(item.currency);
    grouped.set(currency, rounded((grouped.get(currency) ?? 0) + item.amount));
  }
  return [...grouped.entries()]
    .map(([currency, amount]) => ({ amount, currency }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function groupBudgetByCurrency(plan: BudgetPlanItem[], reality: BudgetRealityItem[]): BudgetCurrencyGroup[] {
  const planSummary = summarizeBudgetAmounts(plan.map((item) => ({ amount: item.plannedAmount, currency: item.currency })));
  const realitySummary = summarizeBudgetAmounts(reality);
  const currencies = new Set([...planSummary.map((item) => item.currency), ...realitySummary.map((item) => item.currency)]);
  return [...currencies].sort().map((currency) => ({
    currency,
    ...calculateBudgetComparison(
      planSummary.find((item) => item.currency === currency)?.amount ?? 0,
      realitySummary.find((item) => item.currency === currency)?.amount ?? 0,
    ),
  }));
}

export function mapAccommodationToReality(item: AccommodationRow, tripCurrency: string): BudgetRealityItem | null {
  if (item.total_price === null) return null;
  const classification = accommodationBudgetClassification(item.accommodation_type);
  return {
    amount: item.total_price,
    category: classification.category,
    currency: normalizeBudgetCurrency(item.currency ?? tripCurrency),
    editable: false,
    id: `accommodation:${item.id}`,
    occurredAt: item.check_in_date,
    origin: "accommodation",
    sourceId: item.id,
    subcategory: classification.subcategory,
    title: item.name,
    tripId: item.trip_id,
  };
}

export function mapAccommodationToPayment(item: AccommodationRow, tripCurrency: string): BudgetPaymentItem | null {
  if (item.total_price === null) return null;
  return createPaymentItem({
    amount: item.total_price,
    currency: normalizeBudgetCurrency(item.currency ?? tripCurrency),
    dueDate: item.balance_due_date,
    id: `accommodation:${item.id}`,
    paidAmount: item.paid_amount,
    paymentStatus: item.payment_status,
    sourceId: item.id,
    sourceType: "accommodation",
    title: item.name,
    tripId: item.trip_id,
  });
}

function firstTransportOccurrence(item: TransportRealitySource) {
  return item.segments
    ?.flatMap((segment) => segment.departure_at ? [segment.departure_at] : [])
    .sort()[0] ?? item.created_at;
}

export function mapTransportToReality(item: TransportRealitySource, tripCurrency: string): BudgetRealityItem | null {
  if (item.total_price === null) return null;
  const classification = transportBudgetClassification(item.transport_type);
  return {
    amount: item.total_price,
    category: classification.category,
    currency: normalizeBudgetCurrency(item.currency ?? tripCurrency),
    editable: false,
    id: `transport:${item.id}`,
    occurredAt: firstTransportOccurrence(item),
    origin: "transport",
    sourceId: item.id,
    subcategory: classification.subcategory,
    title: item.title,
    tripId: item.trip_id,
  };
}

export function mapTransportToPayment(item: TransportBookingRow, tripCurrency: string): BudgetPaymentItem | null {
  if (item.total_price === null) return null;
  return createPaymentItem({
    amount: item.total_price,
    currency: normalizeBudgetCurrency(item.currency ?? tripCurrency),
    dueDate: item.balance_due_date,
    id: `transport:${item.id}`,
    paidAmount: item.paid_amount,
    paymentStatus: item.payment_status,
    sourceId: item.id,
    sourceType: "transport",
    title: item.title,
    tripId: item.trip_id,
  });
}

export function mapManualExpenseToReality(item: ManualExpenseSource): BudgetRealityItem {
  return {
    amount: item.amount,
    category: item.category,
    currency: normalizeBudgetCurrency(item.currency),
    editable: true,
    id: `manual:${item.id}`,
    occurredAt: item.occurredAt,
    origin: "manual",
    sourceId: item.id,
    subcategory: item.subcategory,
    title: item.title,
    tripId: item.tripId,
  };
}

export function mapManualExpenseToPayment(item: ManualExpenseSource): BudgetPaymentItem {
  return createPaymentItem({
    amount: item.amount,
    currency: normalizeBudgetCurrency(item.currency),
    dueDate: item.dueDate,
    id: `manual:${item.id}`,
    paidAmount: item.paidAmount,
    paymentStatus: item.paymentStatus,
    sourceId: item.id,
    sourceType: "manual",
    title: item.title,
    tripId: item.tripId,
  });
}

export function createQuickExpenseInput(draft: QuickExpenseDraft, context: QuickExpenseContext): QuickExpenseInput | null {
  const currency = normalizeBudgetCurrency(context.currency);
  const title = draft.title?.trim() || null;
  const note = draft.note?.trim() || null;
  const subcategory = draft.subcategory ?? null;
  if (
    !Number.isFinite(draft.amount) || draft.amount <= 0 || draft.amount > 999_999_999_999.99
    || !budgetCategories.includes(draft.category)
    || (subcategory !== null && !isSubcategoryForCategory(draft.category, subcategory))
    || !context.tripId.trim() || !context.createdBy.trim()
    || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(Date.parse(context.occurredAt))
    || (title?.length ?? 0) > 160 || (note?.length ?? 0) > 4000
  ) return null;
  return {
    amount: rounded(draft.amount),
    category: draft.category,
    createdBy: context.createdBy,
    currency,
    note,
    occurredAt: context.occurredAt,
    subcategory,
    title,
    tripId: context.tripId,
  };
}

export function summarizeBudgetPayments(items: BudgetPaymentItem[], today: string): BudgetPaymentsSummary {
  const pending = items.filter((item) => item.remainingAmount !== null && item.remainingAmount > 0);
  const byDueDate = (left: BudgetPaymentItem, right: BudgetPaymentItem) =>
    (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31")
    || left.title.localeCompare(right.title, "cs");
  return {
    overduePayments: pending.filter((item) => item.dueDate !== null && item.dueDate < today).sort(byDueDate),
    totalDue: summarizeBudgetAmounts(pending.map((item) => ({ amount: item.remainingAmount!, currency: item.currency }))),
    totalPaid: summarizeBudgetAmounts(items.flatMap((item) => item.paidAmount === null ? [] : [{ amount: item.paidAmount, currency: item.currency }])),
    upcomingPayments: pending.filter((item) => item.dueDate === null || item.dueDate >= today).sort(byDueDate),
  };
}

export function buildBudgetDashboardSummary(
  plan: BudgetPlanItem[],
  reality: BudgetRealityItem[],
  payments: BudgetPaymentItem[],
  today: string,
): BudgetDashboardSummary {
  const comparison = groupBudgetByCurrency(plan, reality);
  return {
    comparison,
    paymentsSummary: summarizeBudgetPayments(payments, today),
    planSummary: comparison.map((item) => ({ amount: item.plannedAmount, currency: item.currency })),
    realitySummary: comparison.map((item) => ({ amount: item.realityAmount, currency: item.currency })),
  };
}

export function defaultQuickExpenseTitle(category: BudgetCategory) {
  return budgetCategoryLabels[category];
}
