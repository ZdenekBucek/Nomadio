import type { BudgetCategory, BudgetPaymentStatus, BudgetSubcategory } from "@/lib/supabase/database.types";
import { budgetCategories, isBudgetSubcategory, isSubcategoryForCategory } from "./budget-categories";
import { budgetPaymentStatuses, deriveBudgetPaymentStatus } from "./budget-model";

export type BudgetItemInput = {
  actualAmount: number | null;
  balanceDueDate: string | null;
  category: BudgetCategory;
  currency: string;
  estimatedAmount: number | null;
  name: string;
  notes: string | null;
  paidAmount: number | null;
  paymentStatus: BudgetPaymentStatus;
  subcategory: BudgetSubcategory | null;
};

export type BudgetItemParseResult =
  | { data: BudgetItemInput; success: true }
  | { success: false };

function optional(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim() ?? "";
  return value || null;
}

function amount(formData: FormData, key: string) {
  const value = optional(formData, key);
  if (value === null) return { valid: true, value: null };
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) return { valid: false, value: null };
  const parsed = Number(value.replace(",", "."));
  return { valid: Number.isFinite(parsed) && parsed >= 0 && parsed <= 999_999_999_999.99, value: parsed };
}

export function parseBudgetItem(formData: FormData): BudgetItemParseResult {
  const name = formData.get("name")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString() ?? "";
  const currency = formData.get("currency")?.toString().trim().toUpperCase() ?? "";
  const status = formData.get("paymentStatus")?.toString() ?? "";
  const subcategory = optional(formData, "subcategory");
  const estimated = amount(formData, "estimatedAmount");
  const actual = amount(formData, "actualAmount");
  const paid = amount(formData, "paidAmount");
  const balanceDueDate = optional(formData, "balanceDueDate");
  const notes = optional(formData, "notes");
  const validCategory = budgetCategories.includes(category as BudgetCategory);
  if (
    name.length < 1 || name.length > 160
    || !validCategory
    || !/^[A-Z]{3}$/.test(currency)
    || !budgetPaymentStatuses.includes(status as BudgetPaymentStatus)
    || !estimated.valid || !actual.valid || !paid.valid
    || (balanceDueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(balanceDueDate))
    || (notes !== null && notes.length > 4000)
    || (subcategory !== null && (
      !isBudgetSubcategory(subcategory)
      || !isSubcategoryForCategory(category as BudgetCategory, subcategory)
    ))
  ) return { success: false };

  const base = actual.value ?? estimated.value;
  if (paid.value !== null && paid.value > 0 && base === null) return { success: false };
  if (base !== null && paid.value !== null && paid.value > base) return { success: false };
  const paymentStatus = deriveBudgetPaymentStatus(
    actual.value,
    estimated.value,
    paid.value,
    status as BudgetPaymentStatus,
  );
  return {
    data: {
      actualAmount: actual.value,
      balanceDueDate,
      category: category as BudgetCategory,
      currency,
      estimatedAmount: estimated.value,
      name,
      notes,
      paidAmount: paid.value,
      paymentStatus,
      subcategory: subcategory as BudgetSubcategory | null,
    },
    success: true,
  };
}
