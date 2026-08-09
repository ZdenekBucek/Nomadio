"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseBudgetPlanItem, type BudgetPlanItemInput } from "./budget-plan-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function budgetPath(tripId: string, status: string) {
  return uuidPattern.test(tripId) ? `/app/trips/${tripId}/budget?budget=${status}` : "/app/trips";
}

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/budget`);
  return { supabase, userId: data.user.id };
}

function databaseValues(input: BudgetPlanItemInput) {
  return {
    category: input.category,
    currency: input.currency,
    name: input.name,
    notes: input.notes,
    planned_amount: input.plannedAmount,
    subcategory: input.subcategory,
  };
}

export async function createBudgetPlanItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const parsed = parseBudgetPlanItem(formData);
  if (!uuidPattern.test(tripId) || !parsed.success) redirect(budgetPath(tripId, "plan-invalid"));

  const { supabase, userId } = await authenticatedClient(tripId);
  const { error } = await supabase.from("budget_plan_items").insert({
    ...databaseValues(parsed.data),
    created_by: userId,
    trip_id: tripId,
  });
  if (error) redirect(budgetPath(tripId, "plan-error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(budgetPath(tripId, "plan-created"));
}

export async function updateBudgetPlanItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const itemId = formData.get("itemId")?.toString().trim() ?? "";
  const parsed = parseBudgetPlanItem(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(itemId) || !parsed.success) {
    redirect(budgetPath(tripId, "plan-invalid"));
  }

  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("budget_plan_items")
    .update(databaseValues(parsed.data))
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) redirect(budgetPath(tripId, "plan-error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(budgetPath(tripId, "plan-updated"));
}

export async function deleteBudgetPlanItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const itemId = formData.get("itemId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(itemId)) redirect(budgetPath(tripId, "plan-invalid"));

  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("budget_plan_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) redirect(budgetPath(tripId, "plan-error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(budgetPath(tripId, "plan-removed"));
}
