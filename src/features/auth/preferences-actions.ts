"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateQuickExpenseFabPreference(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/app/settings");

  const value = formData.get("quickExpenseFabEnabled");
  if (value !== "true" && value !== "false") redirect("/app/settings?preference=invalid");

  const { error } = await supabase
    .from("profiles")
    .update({ quick_expense_fab_enabled: value === "true" })
    .eq("id", data.user.id);
  if (error) redirect("/app/settings?preference=error");

  revalidatePath("/app", "layout");
  redirect("/app/settings?preference=saved");
}
