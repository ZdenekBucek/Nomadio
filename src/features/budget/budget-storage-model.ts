import type { BudgetPlanItemRow, ExpenseRow } from "@/lib/supabase/database.types";
import type { BudgetPlanItem, BudgetRealityItem } from "./budget-domain";

export type Expense = {
  amount: number;
  category: ExpenseRow["category"];
  createdAt: string;
  createdBy: string;
  currency: string;
  id: string;
  notes: string | null;
  occurredAt: string;
  paidByTravelerId: string | null;
  subcategory: ExpenseRow["subcategory"];
  title: string | null;
  tripId: string;
  updatedAt: string;
};

export function mapBudgetPlanItemRow(item: BudgetPlanItemRow): BudgetPlanItem {
  return {
    category: item.category,
    currency: item.currency,
    id: item.id,
    name: item.name,
    plannedAmount: item.planned_amount,
    subcategory: item.subcategory,
    tripId: item.trip_id,
  };
}

export function mapExpenseRow(item: ExpenseRow): Expense {
  return {
    amount: item.amount,
    category: item.category,
    createdAt: item.created_at,
    createdBy: item.created_by,
    currency: item.currency,
    id: item.id,
    notes: item.notes,
    occurredAt: item.occurred_at,
    paidByTravelerId: item.paid_by_traveler_id,
    subcategory: item.subcategory,
    title: item.title,
    tripId: item.trip_id,
    updatedAt: item.updated_at,
  };
}

export function mapExpenseToReality(item: Expense): BudgetRealityItem {
  return {
    amount: item.amount,
    category: item.category,
    currency: item.currency,
    editable: true,
    id: `manual:${item.id}`,
    occurredAt: item.occurredAt,
    origin: "manual",
    sourceId: item.id,
    subcategory: item.subcategory,
    title: item.title ?? "Výdaj",
    tripId: item.tripId,
  };
}
