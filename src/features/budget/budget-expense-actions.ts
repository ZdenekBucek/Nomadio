"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseExpenseInput, type ExpenseInput } from "./budget-expense-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function budgetPath(tripId: string, status: string) {
  return uuidPattern.test(tripId) ? `/app/trips/${tripId}/budget?tab=reality&budget=${status}` : "/app/trips";
}

async function authenticatedContext(tripId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/app/trips/${tripId}/budget?tab=reality`);

  const { data: trip, error } = await supabase.from("trips")
    .select("currency")
    .eq("id", tripId)
    .maybeSingle();
  if (error || !trip) redirect(budgetPath(tripId, "expense-error"));
  return { currency: trip.currency, supabase, userId: authData.user.id };
}

function databaseValues(input: ExpenseInput) {
  return {
    amount: input.amount,
    category: input.category,
    currency: input.currency,
    notes: input.notes,
    occurred_at: input.occurredAt,
    paid_by_traveler_id: input.paidByTravelerId,
    subcategory: input.subcategory,
    title: input.title,
  };
}

export async function createExpense(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const globalFlow = formData.get("flow") === "global";
  if (!uuidPattern.test(tripId)) redirect("/app/trips");
  const { currency, supabase, userId } = await authenticatedContext(tripId);
  const parsed = parseExpenseInput(formData, { currency });
  if (!parsed.success) {
    if (globalFlow) return { ok: false as const, error: "invalid" as const };
    redirect(budgetPath(tripId, "expense-invalid"));
  }

  const { error } = await supabase.from("expenses").insert({
    ...databaseValues(parsed.data),
    created_by: userId,
    trip_id: tripId,
  });
  if (error) {
    if (globalFlow) return { ok: false as const, error: "save" as const };
    redirect(budgetPath(tripId, "expense-error"));
  }
  revalidatePath(`/app/trips/${tripId}/budget`);
  if (globalFlow) {
    revalidatePath("/app", "layout");
    return { ok: true as const };
  }
  redirect(budgetPath(tripId, "expense-created"));
}

export async function updateExpense(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const itemId = formData.get("itemId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(itemId)) redirect(budgetPath(tripId, "expense-invalid"));
  const { currency, supabase } = await authenticatedContext(tripId);
  const parsed = parseExpenseInput(formData, { currency });
  if (!parsed.success) redirect(budgetPath(tripId, "expense-invalid"));

  const { error } = await supabase.from("expenses")
    .update(databaseValues(parsed.data))
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) redirect(budgetPath(tripId, "expense-error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(budgetPath(tripId, "expense-updated"));
}

export async function deleteExpense(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const itemId = formData.get("itemId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(itemId)) redirect(budgetPath(tripId, "expense-invalid"));
  const { supabase } = await authenticatedContext(tripId);
  const { error } = await supabase.from("expenses")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) redirect(budgetPath(tripId, "expense-error"));
  revalidatePath(`/app/trips/${tripId}/budget`);
  redirect(budgetPath(tripId, "expense-removed"));
}
