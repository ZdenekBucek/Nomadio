"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { parseNewTrip } from "./trip-input";

export async function createTrip(formData: FormData) {
  const parsed = parseNewTrip(formData);

  if (!parsed.success) {
    redirect(`/app/trips?error=${parsed.error}`);
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/app/trips");
  }

  const tripId = crypto.randomUUID();
  const { error } = await supabase
    .from("trips")
    .insert({
      cities: parsed.data.cities,
      countries: parsed.data.countries,
      created_by: userData.user.id,
      currency: parsed.data.currency,
      end_date: parsed.data.endDate,
      id: tripId,
      name: parsed.data.name,
      start_date: parsed.data.startDate,
    });

  if (error) {
    redirect("/app/trips?error=create");
  }

  revalidatePath("/app/trips");
  redirect(`/app/trips?created=${tripId}`);
}
