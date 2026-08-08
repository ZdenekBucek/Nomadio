import type {
  AccommodationRow,
  BudgetCategory,
  BudgetItemRow,
  BudgetPaymentStatus,
  BudgetSourceType,
  BudgetSubcategory,
  TransportBookingRow,
} from "@/lib/supabase/database.types";
import {
  accommodationBudgetClassification,
  budgetCategories,
  transportBudgetClassification,
} from "./budget-categories";

export type BudgetRow = {
  actualAmount: number | null;
  balanceDueDate: string | null;
  category: BudgetCategory;
  currency: string;
  editable: boolean;
  estimatedAmount: number | null;
  href: string | null;
  id: string;
  name: string;
  notes: string | null;
  paidAmount: number | null;
  paymentStatus: BudgetPaymentStatus;
  remainingAmount: number | null;
  sourceId: string | null;
  sourceType: BudgetSourceType;
  subcategory: BudgetSubcategory | null;
};

export const budgetPaymentStatuses: BudgetPaymentStatus[] = [
  "unknown", "unpaid", "partially_paid", "paid", "pay_on_site",
];

export const budgetPaymentStatusLabels: Record<BudgetPaymentStatus, string> = {
  partially_paid: "Částečně zaplaceno",
  paid: "Zaplaceno",
  pay_on_site: "Platba na místě",
  unknown: "Neznámý stav",
  unpaid: "Nezaplaceno",
};

export function budgetBaseAmount(actualAmount: number | null, estimatedAmount: number | null) {
  return actualAmount ?? estimatedAmount;
}

export function normalizedPaidAmount(
  baseAmount: number | null,
  paidAmount: number | null,
  paymentStatus: BudgetPaymentStatus,
) {
  if (paidAmount !== null) return paidAmount;
  if (baseAmount === null) return null;
  if (paymentStatus === "paid") return baseAmount;
  if (paymentStatus === "unpaid" || paymentStatus === "pay_on_site") return 0;
  return null;
}

export function remainingBudgetAmount(
  actualAmount: number | null,
  estimatedAmount: number | null,
  paidAmount: number | null,
  paymentStatus: BudgetPaymentStatus = "unknown",
) {
  const baseAmount = budgetBaseAmount(actualAmount, estimatedAmount);
  const paid = normalizedPaidAmount(baseAmount, paidAmount, paymentStatus);
  if (baseAmount === null || paid === null) return null;
  const remaining = baseAmount - paid;
  return remaining >= 0 ? Math.round(remaining * 100) / 100 : null;
}

export function deriveBudgetPaymentStatus(
  actualAmount: number | null,
  estimatedAmount: number | null,
  paidAmount: number | null,
  currentStatus: BudgetPaymentStatus,
): BudgetPaymentStatus {
  if (currentStatus === "pay_on_site") return currentStatus;
  const baseAmount = budgetBaseAmount(actualAmount, estimatedAmount);
  if (baseAmount === null || paidAmount === null) return currentStatus;
  if (paidAmount === baseAmount) return "paid";
  if (paidAmount === 0) return "unpaid";
  if (paidAmount > 0 && paidAmount < baseAmount) return "partially_paid";
  return currentStatus;
}

function budgetRow(input: Omit<BudgetRow, "paidAmount" | "remainingAmount"> & { paidAmount: number | null }): BudgetRow {
  const baseAmount = budgetBaseAmount(input.actualAmount, input.estimatedAmount);
  const paidAmount = normalizedPaidAmount(baseAmount, input.paidAmount, input.paymentStatus);
  return {
    ...input,
    paidAmount,
    remainingAmount: remainingBudgetAmount(
      input.actualAmount,
      input.estimatedAmount,
      input.paidAmount,
      input.paymentStatus,
    ),
  };
}

export function normalizeAccommodationBudgetRow(item: AccommodationRow, tripCurrency: string): BudgetRow {
  const classification = accommodationBudgetClassification(item.accommodation_type);
  return budgetRow({
    actualAmount: item.total_price,
    balanceDueDate: item.balance_due_date,
    category: classification.category,
    currency: item.currency ?? tripCurrency,
    editable: false,
    estimatedAmount: null,
    href: `/app/trips/${item.trip_id}/accommodation?edit=${item.id}`,
    id: `accommodation:${item.id}`,
    name: item.name,
    notes: item.notes,
    paidAmount: item.paid_amount,
    paymentStatus: item.payment_status,
    sourceId: item.id,
    sourceType: "accommodation",
    subcategory: classification.subcategory,
  });
}

export function normalizeTransportBudgetRow(item: TransportBookingRow, tripCurrency: string): BudgetRow {
  const classification = transportBudgetClassification(item.transport_type);
  return budgetRow({
    actualAmount: item.total_price,
    balanceDueDate: item.balance_due_date,
    category: classification.category,
    currency: item.currency ?? tripCurrency,
    editable: false,
    estimatedAmount: null,
    href: `/app/trips/${item.trip_id}/transport?edit=${item.id}`,
    id: `transport:${item.id}`,
    name: item.title,
    notes: item.notes,
    paidAmount: item.paid_amount,
    paymentStatus: item.payment_status,
    sourceId: item.id,
    sourceType: "transport",
    subcategory: classification.subcategory,
  });
}

export function normalizeManualBudgetRow(item: BudgetItemRow): BudgetRow {
  return budgetRow({
    actualAmount: item.actual_amount,
    balanceDueDate: item.balance_due_date,
    category: item.category,
    currency: item.currency,
    editable: true,
    estimatedAmount: item.estimated_amount,
    href: null,
    id: item.id,
    name: item.name,
    notes: item.notes,
    paidAmount: item.paid_amount,
    paymentStatus: item.payment_status,
    sourceId: item.source_id,
    sourceType: item.source_type,
    subcategory: item.subcategory,
  });
}

export type BudgetAmounts = {
  actual: number;
  estimated: number;
  paid: number;
  remaining: number;
};

function addAmount(summary: BudgetAmounts, item: BudgetRow) {
  summary.estimated += item.estimatedAmount ?? 0;
  summary.actual += item.actualAmount ?? 0;
  summary.paid += item.paidAmount ?? 0;
  summary.remaining += item.remainingAmount ?? 0;
}

export function summarizeBudgetByCurrency(items: BudgetRow[]) {
  const summaries = new Map<string, BudgetAmounts>();
  for (const item of items) {
    const summary = summaries.get(item.currency) ?? { actual: 0, estimated: 0, paid: 0, remaining: 0 };
    addAmount(summary, item);
    summaries.set(item.currency, summary);
  }
  return [...summaries.entries()]
    .map(([currency, amounts]) => ({ currency, ...amounts }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function summarizeBudgetByCategory(items: BudgetRow[]) {
  return budgetCategories.map((category) => ({
    category,
    currencies: summarizeBudgetByCurrency(items.filter((item) => item.category === category)),
  }));
}

export function summarizeBudgetBySubcategory(items: BudgetRow[], category: BudgetCategory) {
  const groups = new Map<BudgetSubcategory | null, BudgetRow[]>();
  for (const item of items) {
    if (item.category !== category) continue;
    const current = groups.get(item.subcategory) ?? [];
    current.push(item);
    groups.set(item.subcategory, current);
  }
  return [...groups.entries()].map(([subcategory, rows]) => ({
    currencies: summarizeBudgetByCurrency(rows),
    subcategory,
  }));
}

export function pendingBudgetPayments(items: BudgetRow[]) {
  return items
    .filter((item) => item.remainingAmount !== null && item.remainingAmount > 0)
    .sort((left, right) => {
      if (left.balanceDueDate && right.balanceDueDate) {
        return left.balanceDueDate.localeCompare(right.balanceDueDate) || left.name.localeCompare(right.name, "cs");
      }
      if (left.balanceDueDate) return -1;
      if (right.balanceDueDate) return 1;
      return left.name.localeCompare(right.name, "cs");
    });
}

export function formatBudgetMoney(value: number, currency: string) {
  return new Intl.NumberFormat("cs-CZ", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
