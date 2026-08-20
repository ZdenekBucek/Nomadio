import "server-only";

import { cache } from "react";
import { getAccommodations } from "@/features/accommodation/accommodation-data";
import { getTransportBookings } from "@/features/transport/transport-data";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/date-time";
import { buildTripBudgetDashboard, type TripBudgetDashboard } from "./budget-dashboard-model";
import { getBudgetPlanItems, getExpenses } from "./budget-repository";

export const getTripBudgetDashboard = cache(async (tripId: string): Promise<TripBudgetDashboard | null> => {
  const supabase = await createClient();
  const [tripResult, planItems, expenses, accommodations, transportBookings] = await Promise.all([
    supabase.from("trips").select("id,currency,timezone").eq("id", tripId).maybeSingle(),
    getBudgetPlanItems(tripId),
    getExpenses(tripId),
    getAccommodations(tripId),
    getTransportBookings(tripId),
  ]);

  if (tripResult.error) throw tripResult.error;
  if (!tripResult.data) return null;

  return buildTripBudgetDashboard({
    accommodations,
    expenses,
    planItems,
    today: todayInTimeZone(tripResult.data.timezone),
    transportBookings,
    tripCurrency: tripResult.data.currency,
    tripId: tripResult.data.id,
  });
});
