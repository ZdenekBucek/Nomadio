import "server-only";

import { cache } from "react";
import { mapAccommodationToPayment, mapTransportToPayment } from "@/features/budget/budget-domain";
import type { AccommodationRow, TaskRow, TransportBookingRow, TransportSegmentRow, TripRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { buildCalendarAgenda, calendarMonthEvents, calendarPaymentEvents, type CalendarTransportEvent } from "./calendar-model";

function dateAndTimeInTripZone(value: string, timeZone: string) {
  const format = new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "2-digit", timeZone, year: "numeric" });
  const parts = format.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: part("hour") === "24" ? `00:${part("minute")}` : `${part("hour")}:${part("minute")}` };
}

export const getCalendarTrips = cache(async () => {
  const supabase = await createClient();
  const tripResult = await supabase.from("trips").select("*").neq("status", "archived").order("start_date", { ascending: true, nullsFirst: false });
  if (tripResult.error) throw tripResult.error;
  return (tripResult.data ?? []) as TripRow[];
});

export const getGlobalCalendarData = cache(async () => {
  const supabase = await createClient();
  const trips = await getCalendarTrips();
  if (!trips.length) return { agenda: [], loadWarnings: [], monthEvents: [], trips };
  const tripIds = trips.map((trip) => trip.id);
  const [accommodationResult, bookingResult, taskResult] = await Promise.all([
    supabase.from("accommodations").select("*").in("trip_id", tripIds),
    supabase.from("transport_bookings").select("*").in("trip_id", tripIds),
    supabase.from("tasks").select("*").in("trip_id", tripIds),
  ]);
  const bookings = (bookingResult.data ?? []) as TransportBookingRow[];
  const segmentResult = bookings.length ? await supabase.from("transport_segments").select("*").in("booking_id", bookings.map((booking) => booking.id)) : { data: [], error: null };
  const warnings = [accommodationResult.error, bookingResult.error, taskResult.error, segmentResult.error].filter(Boolean).map(() => "Některé sekundární události se nepodařilo načíst.");
  const accommodations = (accommodationResult.data ?? []) as AccommodationRow[];
  const tasks = (taskResult.data ?? []) as TaskRow[];
  const segments = (segmentResult.data ?? []) as TransportSegmentRow[];
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const transports: CalendarTransportEvent[] = segments.flatMap((segment) => {
    if (!segment.departure_at) return [];
    const booking = bookingById.get(segment.booking_id); const trip = booking ? tripById.get(booking.trip_id) : null;
    if (!booking || !trip) return [];
    const local = dateAndTimeInTripZone(segment.departure_at, trip.timezone);
    return [{ date: local.date, href: `/app/trips/${trip.id}/transport?edit=${booking.id}`, id: segment.id, startTime: local.time, subtitle: segment.service_number ? `${booking.title} · ${segment.service_number}` : booking.title, title: booking.title, tripId: trip.id }];
  });
  const payments = calendarPaymentEvents([
    ...accommodations.map((item) => mapAccommodationToPayment(item, tripById.get(item.trip_id)?.currency ?? "CZK")),
    ...bookings.map((item) => mapTransportToPayment(item, tripById.get(item.trip_id)?.currency ?? "CZK")),
  ].filter((item) => item !== null));
  const agenda = buildCalendarAgenda({ accommodations, payments, tasks, transports, trips });
  return { agenda, loadWarnings: warnings.slice(0, 1), monthEvents: calendarMonthEvents(agenda), trips };
});
