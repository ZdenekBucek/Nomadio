"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseTransportBooking, type TransportPlaceSelection } from "./transport-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function path(tripId: string, status: string) {
  return uuidPattern.test(tripId) ? `/app/trips/${tripId}/transport?transport=${status}` : "/app/trips";
}

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/transport`);
  return supabase;
}

async function resolvePlace(
  selection: TransportPlaceSelection,
  tripId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  cache: Map<string, string>,
) {
  if (selection.mode === "none") return null;
  if (selection.mode === "saved") return selection.placeId;
  const result = selection.result;
  const key = `${result.provider}:${result.providerPlaceId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { data, error } = await supabase.rpc("create_external_trip_place", {
    place_address: result.formattedAddress || null,
    place_attribution: result.attribution,
    place_category: selection.category,
    place_city: result.city,
    place_country_code: result.countryCode,
    place_latitude: result.latitude,
    place_longitude: result.longitude,
    place_name: result.name,
    place_provider_category: (result.providerCategories.join(",") || "unknown").slice(0, 160),
    source_provider: result.provider,
    source_provider_place_id: result.providerPlaceId,
    suggested_place_category: result.category,
    target_trip_id: tripId,
  });
  if (error || !data) throw new Error("place-resolution-failed");
  cache.set(key, data);
  return data;
}

export async function saveTransportBooking(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const bookingIdText = formData.get("bookingId")?.toString().trim() ?? "";
  const bookingId = bookingIdText || null;
  const parsed = parseTransportBooking(formData);
  if (!uuidPattern.test(tripId) || (bookingId !== null && !uuidPattern.test(bookingId)) || !parsed.success) {
    redirect(path(tripId, "invalid"));
  }
  const supabase = await authenticatedClient(tripId);
  const placeCache = new Map<string, string>();
  let segments: Array<Record<string, string | null>>;
  try {
    segments = [];
    for (const segment of parsed.data.segments) {
      const departurePlaceId = await resolvePlace(segment.departurePlace, tripId, supabase, placeCache);
      const arrivalPlaceId = await resolvePlace(segment.arrivalPlace, tripId, supabase, placeCache);
      segments.push({
        arrival_at: segment.arrivalAt,
        arrival_place_id: arrivalPlaceId,
        baggage: segment.baggage,
        departure_at: segment.departureAt,
        departure_place_id: departurePlaceId,
        notes: segment.notes,
        platform: segment.platform,
        seat: segment.seat,
        service_number: segment.serviceNumber,
        terminal: segment.terminal,
      });
    }
  } catch {
    redirect(path(tripId, "place-error"));
  }

  const input = parsed.data;
  const { error } = await supabase.rpc("save_transport_booking", {
    booking_balance_due_date: input.balanceDueDate,
    booking_currency: input.currency,
    booking_notes: input.notes,
    booking_paid_amount: input.paidAmount,
    booking_payment_status: input.paymentStatus,
    booking_provider: input.provider,
    booking_reference: input.bookingReference,
    booking_segments: segments,
    booking_status: input.status,
    booking_title: input.title,
    booking_total_price: input.totalPrice,
    booking_transport_type: input.transportType,
    target_booking_id: bookingId,
    target_trip_id: tripId,
  });
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/transport`);
  revalidatePath(`/app/trips/${tripId}/map`);
  redirect(path(tripId, bookingId ? "updated" : "created"));
}

export async function deleteTransportBooking(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const bookingId = formData.get("bookingId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId) || !uuidPattern.test(bookingId)) redirect(path(tripId, "invalid"));
  const supabase = await authenticatedClient(tripId);
  const { error } = await supabase.rpc("remove_transport_booking", { target_booking_id: bookingId });
  if (error) redirect(path(tripId, "error"));
  revalidatePath(`/app/trips/${tripId}/transport`);
  redirect(path(tripId, "removed"));
}
