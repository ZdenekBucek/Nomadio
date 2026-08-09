import type { BudgetCategory, BudgetSubcategory } from "@/lib/supabase/database.types";
import { createQuickExpenseInput, type QuickExpenseInput } from "./budget-domain";
import { budgetCategories, isBudgetSubcategory } from "./budget-categories";

export type QuickExpenseServerContext = {
  createdBy: string;
  currency: string;
  now?: Date;
  tripId: string;
};

export type QuickExpenseParseResult =
  | { data: QuickExpenseInput; success: true }
  | { success: false };

function optional(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || null;
}

export function parseQuickExpense(formData: FormData, context: QuickExpenseServerContext): QuickExpenseParseResult {
  const amountText = formData.get("amount")?.toString().trim() ?? "";
  const categoryText = formData.get("category")?.toString() ?? "";
  const subcategoryText = optional(formData, "subcategory");
  if (
    !/^\d+(?:[.,]\d{1,2})?$/.test(amountText)
    || !budgetCategories.includes(categoryText as BudgetCategory)
    || (subcategoryText !== null && !isBudgetSubcategory(subcategoryText))
  ) return { success: false };

  const input = createQuickExpenseInput({
    amount: Number(amountText.replace(",", ".")),
    category: categoryText as BudgetCategory,
    note: optional(formData, "notes"),
    subcategory: subcategoryText as BudgetSubcategory | null,
    title: optional(formData, "title"),
  }, {
    createdBy: context.createdBy,
    currency: context.currency,
    occurredAt: (context.now ?? new Date()).toISOString(),
    tripId: context.tripId,
  });
  return input ? { data: input, success: true } : { success: false };
}
