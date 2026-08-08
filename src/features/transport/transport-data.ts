import "server-only";

import { cache } from "react";
import type { TransportBookingRow, TransportSegmentRow, TripPlaceRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { sortTransportBookings, type TransportBookingWithSegments, type TransportSegmentWithPlaces } from "./transport-model";

export const getTransportBookings = cache(async (tripId: string): Promise<TransportBookingWithSegments[]> => {
  const supabase = await createClient();
  const [bookingsResult, placesResult] = await Promise.all([
    supabase.from("transport_bookings").select("*").eq("trip_id", tripId),
    supabase.from("trip_places").select("*").eq("trip_id", tripId),
  ]);
  if (bookingsResult.error) throw bookingsResult.error;
  if (placesResult.error) throw placesResult.error;
  const bookings = bookingsResult.data as TransportBookingRow[];
  if (!bookings.length) return [];

  const { data, error } = await supabase.from("transport_segments").select("*").in("booking_id", bookings.map((item) => item.id)).order("sort_order", { ascending: true });
  if (error) throw error;
  const places = new Map((placesResult.data as TripPlaceRow[]).map((place) => [place.id, place]));
  const segmentsByBooking = new Map<string, TransportSegmentWithPlaces[]>();
  for (const segment of data as TransportSegmentRow[]) {
    const hydrated: TransportSegmentWithPlaces = {
      ...segment,
      arrivalPlace: segment.arrival_place_id ? places.get(segment.arrival_place_id) ?? null : null,
      departurePlace: segment.departure_place_id ? places.get(segment.departure_place_id) ?? null : null,
    };
    const current = segmentsByBooking.get(segment.booking_id) ?? [];
    current.push(hydrated);
    segmentsByBooking.set(segment.booking_id, current);
  }
  return sortTransportBookings(bookings.map((booking) => ({ ...booking, segments: segmentsByBooking.get(booking.id) ?? [] })));
});
