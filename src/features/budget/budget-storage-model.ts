import type { BudgetPlanItemRow, ExpenseRow } from "@/lib/supabase/database.types";
import type { BudgetManualExpenseItem, BudgetPlanItem } from "./budget-domain";

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
    notes: item.notes,
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

export function mapExpenseToReality(item: Expense): BudgetManualExpenseItem {
  return {
    amount: item.amount,
    category: item.category,
    currency: item.currency,
    editable: true,
    enteredTitle: item.title,
    id: `manual:${item.id}`,
    occurredAt: item.occurredAt,
    origin: "manual",
    notes: item.notes,
    paidByTravelerId: item.paidByTravelerId,
    sourceId: item.id,
    subcategory: item.subcategory,
    title: item.title ?? "Výdaj",
    tripId: item.tripId,
  };
}
