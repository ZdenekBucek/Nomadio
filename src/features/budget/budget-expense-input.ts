import type { BudgetCategory, BudgetSubcategory } from "@/lib/supabase/database.types";
import { isValidDateOnly } from "@/lib/date-time";
import { budgetCategories, isBudgetSubcategory, isSubcategoryForCategory } from "./budget-categories";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ExpenseInput = {
  amount: number;
  category: BudgetCategory;
  currency: string;
  notes: string | null;
  occurredAt: string;
  paidByTravelerId: string | null;
  subcategory: BudgetSubcategory | null;
  title: string | null;
};

export type ExpenseParseResult =
  | { data: ExpenseInput; success: true }
  | { success: false };

export type ExpenseInputContext = {
  currency: string;
  now?: Date;
};

function optional(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || null;
}

export function parseExpenseInput(formData: FormData, context: ExpenseInputContext): ExpenseParseResult {
  const amountText = formData.get("amount")?.toString().trim() ?? "";
  const categoryText = formData.get("category")?.toString() ?? "";
  const subcategoryText = optional(formData, "subcategory");
  const title = optional(formData, "title");
  const notes = optional(formData, "notes");
  const occurredDate = optional(formData, "occurredDate");
  const paidByTravelerId = optional(formData, "paidByTravelerId");
  const currency = context.currency.trim().toUpperCase();
  const amount = Number(amountText.replace(",", "."));
  const categoryIsValid = budgetCategories.includes(categoryText as BudgetCategory);

  if (
    !/^\d+(?:[.,]\d{1,2})?$/.test(amountText)
    || !Number.isFinite(amount)
    || amount <= 0
    || amount > 999_999_999_999.99
    || !categoryIsValid
    || !/^[A-Z]{3}$/.test(currency)
    || (title?.length ?? 0) > 160
    || (notes?.length ?? 0) > 4000
    || (occurredDate !== null && !isValidDateOnly(occurredDate))
    || (paidByTravelerId !== null && !uuidPattern.test(paidByTravelerId))
    || (subcategoryText !== null && (
      !isBudgetSubcategory(subcategoryText)
      || !isSubcategoryForCategory(categoryText as BudgetCategory, subcategoryText)
    ))
  ) return { success: false };

  return {
    data: {
      amount,
      category: categoryText as BudgetCategory,
      currency,
      notes,
      occurredAt: occurredDate ? `${occurredDate}T12:00:00.000Z` : (context.now ?? new Date()).toISOString(),
      paidByTravelerId,
      subcategory: subcategoryText as BudgetSubcategory | null,
      title,
    },
    success: true,
  };
}
