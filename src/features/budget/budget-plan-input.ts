import type { BudgetCategory, BudgetSubcategory } from "@/lib/supabase/database.types";
import {
  budgetCategories,
  budgetCategoryLabels,
  isBudgetSubcategory,
  isSubcategoryForCategory,
} from "./budget-categories";

export type BudgetPlanItemInput = {
  category: BudgetCategory;
  currency: string;
  name: string;
  notes: string | null;
  plannedAmount: number;
  subcategory: BudgetSubcategory | null;
};

export type BudgetPlanItemParseResult =
  | { data: BudgetPlanItemInput; success: true }
  | { success: false };

function optional(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || null;
}

export function parseBudgetPlanItem(formData: FormData): BudgetPlanItemParseResult {
  const categoryValue = formData.get("category")?.toString() ?? "";
  const amountValue = formData.get("plannedAmount")?.toString().trim() ?? "";
  const currency = formData.get("currency")?.toString().trim().toUpperCase() ?? "";
  const subcategoryValue = optional(formData, "subcategory");
  const customName = optional(formData, "name");
  const notes = optional(formData, "notes");
  const categoryIsValid = budgetCategories.includes(categoryValue as BudgetCategory);
  const amountIsValid = /^\d+(?:[.,]\d{1,2})?$/.test(amountValue);
  const plannedAmount = Number(amountValue.replace(",", "."));

  if (
    !categoryIsValid
    || !amountIsValid
    || !Number.isFinite(plannedAmount)
    || plannedAmount < 0
    || plannedAmount > 999_999_999_999.99
    || !/^[A-Z]{3}$/.test(currency)
    || (customName?.length ?? 0) > 160
    || (notes?.length ?? 0) > 4000
    || (subcategoryValue !== null && (
      !isBudgetSubcategory(subcategoryValue)
      || !isSubcategoryForCategory(categoryValue as BudgetCategory, subcategoryValue)
    ))
  ) return { success: false };

  const category = categoryValue as BudgetCategory;
  return {
    data: {
      category,
      currency,
      name: customName ?? budgetCategoryLabels[category],
      notes,
      plannedAmount,
      subcategory: subcategoryValue as BudgetSubcategory | null,
    },
    success: true,
  };
}
