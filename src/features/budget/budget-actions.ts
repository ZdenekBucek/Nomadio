"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseBudgetItem, type BudgetItemInput } from "./budget-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function path(tripId: string, status: string) {
  return uuidPattern.test(tripId) ? `/app/trips/${tripId}/budget?budget=${status}` : "/app/trips";
}

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/budget`);
  return { supabase, userId: data.user.id };
}

function databaseValues(input: BudgetItemInput) {
  return {
    actual_amount: input.actualAmount,
    balance_due_date: input.balanceDueDate,
    category: input.category,
    currency: input.currency,
    estimated_amount: input.estimatedAmount,
    name: input.name,
    notes: input.notes,
    paid_amount: input.paidAmount,
    payment_status: input.paymentStatus,
    subcategory: input.subcategory,
  };
}

export async function createBudgetItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const parsed = parseBudgetItem(formData);
  if (!uuidPattern.test(tripId) || !parsed.success) redirect(path(tripId, "invalid"));
  const { supabase, userId } = await authenticatedClient(tripId);
  const { error } = await supabase.from("budget_items").insert({
    ...databaseValues(parsed.data),
    created_by: userId,
    source_id: null,
    source_type: "manual",
    trip_id: tripId,
  });
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(path(tripId, "created"));
}

export async function updateBudgetItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const itemId = formData.get("itemId")?.toString().trim() ?? "";
  const parsed = parseBudgetItem(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(itemId) || !parsed.success) redirect(path(tripId, "invalid"));
  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("budget_items")
    .update(databaseValues(parsed.data))
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .eq("source_type", "manual");
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(path(tripId, "updated"));
}

export async function deleteBudgetItem(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const itemId = formData.get("itemId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(itemId)) redirect(path(tripId, "invalid"));
  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("budget_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .eq("source_type", "manual");
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(path(tripId, "removed"));
}
