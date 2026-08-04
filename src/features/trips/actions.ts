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

  const { data: tripId, error } = await supabase.rpc("create_private_trip", {
    destination_city: parsed.data.city,
    destination_continent: parsed.data.continent,
    destination_continent_overridden: parsed.data.continentOverridden,
    destination_country_code: parsed.data.countryCode,
    destination_country_name: parsed.data.countryName,
    trip_cover_variant: parsed.data.coverVariant,
    trip_currency: parsed.data.currency,
    trip_description: parsed.data.description,
    trip_end_date: parsed.data.endDate,
    trip_name: parsed.data.name,
    trip_start_date: parsed.data.startDate,
    trip_status: parsed.data.status,
    trip_timezone: parsed.data.timezone,
  });

  if (error || !tripId) {
    redirect("/app/trips?error=create");
  }

  revalidatePath("/app/trips");
  redirect(`/app/trips?created=${tripId}`);
}
