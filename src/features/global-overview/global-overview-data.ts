import "server-only";

import { cache } from "react";
import { buildTripBudgetDashboard } from "@/features/budget/budget-dashboard-model";
import { mapBudgetPlanItemRow, mapExpenseRow } from "@/features/budget/budget-storage-model";
import { getCalendarTrips } from "@/features/calendar/calendar-data";
import { withTraveler } from "@/features/checklist/checklist-model";
import type { AccommodationRow, BudgetPlanItemRow, ExpenseRow, PackingItemRow, TaskRow, TransportBookingRow, TransportSegmentRow, TripDestinationRow, TripTravelerRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/date-time";
import { buildGlobalOverview, type OverviewDocument } from "./global-overview-model";

function localDateTime(value: string, timezone: string) {
  const pieces = new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => pieces.find((entry) => entry.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour") === "24" ? "00" : part("hour")}:${part("minute")}` };
}

export const getGlobalOverviewData = cache(async () => {
  const supabase = await createClient();
  const trips = await getCalendarTrips();
  if (!trips.length) return { data: buildGlobalOverview({ accommodations: [], budgetDashboards: [], destinations: [], documents: [], packingItems: [], tasks: [], transports: [], travelers: [], trips: [] }), loadWarnings: [] as string[] };
  const ids = trips.map((trip) => trip.id);
  const [accommodationResult, planResult, expenseResult, bookingResult, taskResult, documentResult, packingResult, travelerResult, destinationResult] = await Promise.all([
    supabase.from("accommodations").select("*").in("trip_id", ids), supabase.from("budget_plan_items").select("*").in("trip_id", ids), supabase.from("expenses").select("*").in("trip_id", ids), supabase.from("transport_bookings").select("*").in("trip_id", ids), supabase.from("tasks").select("*").in("trip_id", ids), supabase.from("documents").select("id,trip_id,name,is_important,offline_enabled").in("trip_id", ids), supabase.from("packing_items").select("*").in("trip_id", ids), supabase.from("trip_travelers").select("*").in("trip_id", ids), supabase.from("trip_destinations").select("*").in("trip_id", ids).order("sort_order"),
  ]);
  const bookings = (bookingResult.data ?? []) as TransportBookingRow[];
  const segmentResult = bookings.length ? await supabase.from("transport_segments").select("*").in("booking_id", bookings.map((booking) => booking.id)) : { data: [], error: null };
  const warnings = [accommodationResult.error, planResult.error, expenseResult.error, bookingResult.error, taskResult.error, documentResult.error, packingResult.error, travelerResult.error, destinationResult.error, segmentResult.error].filter(Boolean).length;
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const transports = ((segmentResult.data ?? []) as TransportSegmentRow[]).flatMap((segment) => {
    const booking = bookingById.get(segment.booking_id); const trip = booking ? tripById.get(booking.trip_id) : null;
    if (!booking || !trip || !segment.departure_at) return [];
    const local = localDateTime(segment.departure_at, trip.timezone);
    return [{ date: local.date, href: `/app/trips/${trip.id}/transport?edit=${booking.id}`, id: segment.id, startTime: local.time, subtitle: segment.service_number ? `${booking.title} · ${segment.service_number}` : booking.title, title: booking.title, tripId: trip.id }];
  });
  const accommodations = (accommodationResult.data ?? []) as AccommodationRow[];
  const planItems = ((planResult.data ?? []) as BudgetPlanItemRow[]).map(mapBudgetPlanItemRow);
  const expenses = ((expenseResult.data ?? []) as ExpenseRow[]).map(mapExpenseRow);
  const segmentsByBooking = new Map<string, TransportSegmentRow[]>();
  for (const segment of (segmentResult.data ?? []) as TransportSegmentRow[]) {
    const current = segmentsByBooking.get(segment.booking_id) ?? [];
    current.push(segment);
    segmentsByBooking.set(segment.booking_id, current);
  }
  const budgetDashboards = trips.map((trip) => buildTripBudgetDashboard({
    accommodations: accommodations.filter((item) => item.trip_id === trip.id),
    expenses: expenses.filter((item) => item.tripId === trip.id),
    planItems: planItems.filter((item) => item.tripId === trip.id),
    today: todayInTimeZone(trip.timezone),
    transportBookings: bookings.filter((item) => item.trip_id === trip.id).map((booking) => ({
      ...booking,
      segments: (segmentsByBooking.get(booking.id) ?? []).map((segment) => ({ ...segment, arrivalPlace: null, departurePlace: null })),
    })),
    tripCurrency: trip.currency,
    tripId: trip.id,
  }));
  const travelers = (travelerResult.data ?? []) as TripTravelerRow[];
  return { data: buildGlobalOverview({ accommodations, budgetDashboards, destinations: (destinationResult.data ?? []) as TripDestinationRow[], documents: (documentResult.data ?? []) as OverviewDocument[], packingItems: (packingResult.data ?? []) as PackingItemRow[], tasks: ((taskResult.data ?? []) as TaskRow[]).map((task) => withTraveler(task, travelers)), transports, travelers, trips }), loadWarnings: warnings ? ["Některé sekundární údaje se nepodařilo načíst."] : [] };
});
