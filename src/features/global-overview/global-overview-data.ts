import "server-only";

import { cache } from "react";
import { normalizeAccommodationBudgetRow, normalizeManualBudgetRow, normalizeTransportBudgetRow } from "@/features/budget/budget-model";
import { getCalendarTrips } from "@/features/calendar/calendar-data";
import { withTraveler } from "@/features/checklist/checklist-model";
import type { AccommodationRow, BudgetItemRow, PackingItemRow, TaskRow, TransportBookingRow, TransportSegmentRow, TripDestinationRow, TripTravelerRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { buildGlobalOverview, type OverviewDocument } from "./global-overview-model";

function localDateTime(value: string, timezone: string) {
  const pieces = new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => pieces.find((entry) => entry.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour") === "24" ? "00" : part("hour")}:${part("minute")}` };
}

export const getGlobalOverviewData = cache(async () => {
  const supabase = await createClient();
  const trips = await getCalendarTrips();
  if (!trips.length) return { data: buildGlobalOverview({ accommodations: [], budget: [], destinations: [], documents: [], packingItems: [], tasks: [], transports: [], travelers: [], trips: [] }), loadWarnings: [] as string[] };
  const ids = trips.map((trip) => trip.id);
  const [accommodationResult, budgetResult, bookingResult, taskResult, documentResult, packingResult, travelerResult, destinationResult] = await Promise.all([
    supabase.from("accommodations").select("*").in("trip_id", ids), supabase.from("budget_items").select("*").in("trip_id", ids), supabase.from("transport_bookings").select("*").in("trip_id", ids), supabase.from("tasks").select("*").in("trip_id", ids), supabase.from("documents").select("id,trip_id,name,is_important,offline_enabled").in("trip_id", ids), supabase.from("packing_items").select("*").in("trip_id", ids), supabase.from("trip_travelers").select("*").in("trip_id", ids), supabase.from("trip_destinations").select("*").in("trip_id", ids).order("sort_order"),
  ]);
  const bookings = (bookingResult.data ?? []) as TransportBookingRow[];
  const segmentResult = bookings.length ? await supabase.from("transport_segments").select("*").in("booking_id", bookings.map((booking) => booking.id)) : { data: [], error: null };
  const warnings = [accommodationResult.error, budgetResult.error, bookingResult.error, taskResult.error, documentResult.error, packingResult.error, travelerResult.error, destinationResult.error, segmentResult.error].filter(Boolean).length;
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const transports = ((segmentResult.data ?? []) as TransportSegmentRow[]).flatMap((segment) => {
    const booking = bookingById.get(segment.booking_id); const trip = booking ? tripById.get(booking.trip_id) : null;
    if (!booking || !trip || !segment.departure_at) return [];
    const local = localDateTime(segment.departure_at, trip.timezone);
    return [{ date: local.date, href: `/app/trips/${trip.id}/transport?edit=${booking.id}`, id: segment.id, startTime: local.time, subtitle: segment.service_number ? `${booking.title} · ${segment.service_number}` : booking.title, title: booking.title, tripId: trip.id }];
  });
  const accommodations = (accommodationResult.data ?? []) as AccommodationRow[];
  const budget = [
    ...((budgetResult.data ?? []) as BudgetItemRow[]).map((item) => ({ ...normalizeManualBudgetRow(item), tripId: item.trip_id })),
    ...accommodations.map((item) => ({ ...normalizeAccommodationBudgetRow(item, tripById.get(item.trip_id)?.currency ?? "CZK"), tripId: item.trip_id })),
    ...bookings.map((item) => ({ ...normalizeTransportBudgetRow(item, tripById.get(item.trip_id)?.currency ?? "CZK"), tripId: item.trip_id })),
  ];
  const travelers = (travelerResult.data ?? []) as TripTravelerRow[];
  return { data: buildGlobalOverview({ accommodations, budget, destinations: (destinationResult.data ?? []) as TripDestinationRow[], documents: (documentResult.data ?? []) as OverviewDocument[], packingItems: (packingResult.data ?? []) as PackingItemRow[], tasks: ((taskResult.data ?? []) as TaskRow[]).map((task) => withTraveler(task, travelers)), transports, travelers, trips }), loadWarnings: warnings ? ["Některé sekundární údaje se nepodařilo načíst."] : [] };
});
