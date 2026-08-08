"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseExternalPlace } from "@/features/itinerary/external-place-input";
import { createClient } from "@/lib/supabase/server";
import { parseAccommodation, type AccommodationInput } from "./accommodation-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function path(tripId: string, status: string) {
  return uuidPattern.test(tripId)
    ? `/app/trips/${tripId}/accommodation?accommodation=${status}`
    : "/app/trips";
}

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/accommodation`);
  return { supabase, userId: data.user.id };
}

function databaseValues(input: AccommodationInput, placeId: string | null) {
  return {
    accommodation_type: input.accommodationType,
    balance_due_date: input.balanceDueDate,
    booking_reference: input.bookingReference,
    booking_url: input.bookingUrl,
    breakfast_included: input.breakfastIncluded,
    check_in_date: input.checkInDate,
    check_in_time: input.checkInTime,
    check_out_date: input.checkOutDate,
    check_out_time: input.checkOutTime,
    currency: input.currency,
    guest_count: input.guestCount,
    name: input.name,
    notes: input.notes,
    paid_amount: input.paidAmount,
    payment_status: input.paymentStatus,
    place_id: placeId,
    room_type: input.roomType,
    total_price: input.totalPrice,
  };
}

async function resolvePlace(formData: FormData, tripId: string) {
  if (formData.get("placeMode")?.toString() !== "external") {
    return { error: false, placeId: formData.get("placeId")?.toString().trim() || null };
  }
  const externalData = new FormData();
  for (const key of ["provider", "providerPlaceId", "providerCategory", "address", "city", "countryCode", "latitude", "longitude", "suggestedCategory", "attribution", "category"]) {
    const value = formData.get(key);
    if (value !== null) externalData.set(key, value);
  }
  externalData.set("name", formData.get("externalName")?.toString() ?? "");
  const parsed = parseExternalPlace(externalData);
  if (!parsed.success) return { error: true, placeId: null };
  const value = parsed.data;
  const { supabase } = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("create_external_trip_place", {
    place_address: value.address,
    place_attribution: value.attribution,
    place_category: value.category,
    place_city: value.city,
    place_country_code: value.countryCode,
    place_latitude: value.latitude,
    place_longitude: value.longitude,
    place_name: value.name,
    place_provider_category: value.providerCategory,
    source_provider: value.provider,
    source_provider_place_id: value.providerPlaceId,
    suggested_place_category: value.suggestedCategory,
    target_trip_id: tripId,
  });
  return { error: Boolean(error || !data), placeId: data ?? null };
}

export async function createAccommodation(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const parsed = parseAccommodation(formData);
  if (!uuidPattern.test(tripId) || !parsed.success) redirect(path(tripId, "invalid"));
  const resolved = await resolvePlace(formData, tripId);
  if (resolved.error) redirect(path(tripId, "place-error"));
  const { supabase, userId } = await authenticatedClient(tripId);
  const { error } = await supabase.from("accommodations").insert({
    ...databaseValues(parsed.data, resolved.placeId),
    created_by: userId,
    trip_id: tripId,
  });
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/accommodation`);
  revalidatePath(`/app/trips/${tripId}/map`);
  redirect(path(tripId, "created"));
}

export async function updateAccommodation(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const accommodationId = formData.get("accommodationId")?.toString().trim() ?? "";
  const parsed = parseAccommodation(formData);
  if (!uuidPattern.test(tripId) || !uuidPattern.test(accommodationId) || !parsed.success) {
    redirect(path(tripId, "invalid"));
  }
  const resolved = await resolvePlace(formData, tripId);
  if (resolved.error) redirect(path(tripId, "place-error"));
  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("accommodations")
    .update(databaseValues(parsed.data, resolved.placeId))
    .eq("id", accommodationId)
    .eq("trip_id", tripId);
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/accommodation`);
  redirect(path(tripId, "updated"));
}

export async function deleteAccommodation(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const accommodationId = formData.get("accommodationId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(accommodationId)) redirect(path(tripId, "invalid"));
  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("accommodations").delete().eq("id", accommodationId).eq("trip_id", tripId);
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/accommodation`);
  redirect(path(tripId, "removed"));
}
