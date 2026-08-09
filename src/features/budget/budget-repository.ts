import "server-only";

import { cache } from "react";
import type { BudgetPlanItemRow, ExpenseRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { BudgetPlanItem } from "./budget-domain";
import { mapBudgetPlanItemRow, mapExpenseRow, type Expense } from "./budget-storage-model";

export const getBudgetPlanItems = cache(async (tripId: string): Promise<BudgetPlanItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_plan_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as BudgetPlanItemRow[]).map(mapBudgetPlanItemRow);
});

export const getExpenses = cache(async (tripId: string): Promise<Expense[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ExpenseRow[]).map(mapExpenseRow);
});
