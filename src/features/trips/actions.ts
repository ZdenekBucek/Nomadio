"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { parseNewTrip } from "./trip-input";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function shareRedirect(status: string, tripId: string) {
  const params = new URLSearchParams({ share: status });
  return uuidPattern.test(tripId)
    ? `/app/trips/${tripId}?${params.toString()}`
    : `/app/trips?${params.toString()}`;
}

function memberRedirect(status: string, tripId: string) {
  const params = new URLSearchParams({ member: status });
  return uuidPattern.test(tripId)
    ? `/app/trips/${tripId}?${params.toString()}`
    : `/app/trips?${params.toString()}`;
}

function revalidateTripMembership(tripId: string) {
  revalidatePath("/app/trips");
  revalidatePath(`/app/trips/${tripId}`);
}

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
    traveler_names: parsed.data.travelerNames,
  });

  if (error || !tripId) {
    redirect("/app/trips?error=create");
  }

  revalidatePath("/app/trips");
  redirect(`/app/trips?created=${tripId}`);
}

export async function shareTrip(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const role = formData.get("role")?.toString() ?? "viewer";

  if (
    !uuidPattern.test(tripId) ||
    email.length > 320 ||
    !emailPattern.test(email) ||
    !["editor", "viewer"].includes(role)
  ) {
    redirect(shareRedirect("invalid", tripId));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/app/trips/${tripId}`);
  }

  const { data: result, error } = await supabase.rpc("add_trip_member_by_email", {
    target_email: email,
    target_role: role as "editor" | "viewer",
    target_trip_id: tripId,
  });

  if (error || !result) {
    redirect(shareRedirect("error", tripId));
  }

  if (result === "added") {
    revalidateTripMembership(tripId);
  }

  redirect(shareRedirect(result.replaceAll("_", "-"), tripId));
}

export async function updateTripMemberRole(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const userId = formData.get("userId")?.toString().trim() ?? "";
  const role = formData.get("role")?.toString() ?? "";

  if (
    !uuidPattern.test(tripId) ||
    !uuidPattern.test(userId) ||
    !["editor", "viewer"].includes(role)
  ) {
    redirect(memberRedirect("invalid", tripId));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/app/trips/${tripId}`);
  }

  const { data: result, error } = await supabase.rpc("update_trip_member_role", {
    target_role: role as "editor" | "viewer",
    target_trip_id: tripId,
    target_user_id: userId,
  });

  if (error || !result) {
    redirect(memberRedirect("error", tripId));
  }

  if (result === "updated") {
    revalidateTripMembership(tripId);
  }

  const status =
    result === "updated"
      ? "role-updated"
      : result === "no_change"
        ? "role-unchanged"
        : "member-not-found";
  redirect(memberRedirect(status, tripId));
}

export async function removeTripMember(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const userId = formData.get("userId")?.toString().trim() ?? "";

  if (!uuidPattern.test(tripId) || !uuidPattern.test(userId)) {
    redirect(memberRedirect("invalid", tripId));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/app/trips/${tripId}`);
  }

  const { data: result, error } = await supabase.rpc("remove_trip_member", {
    target_trip_id: tripId,
    target_user_id: userId,
  });

  if (error || !result) {
    redirect(memberRedirect("error", tripId));
  }

  if (result === "removed") {
    revalidateTripMembership(tripId);
  }

  redirect(
    memberRedirect(result === "removed" ? "removed" : "member-not-found", tripId),
  );
}
