import "server-only";

import { cache } from "react";
import type { AccommodationRow, BudgetItemRow, TransportBookingRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeAccommodationBudgetRow,
  normalizeManualBudgetRow,
  normalizeTransportBudgetRow,
  type BudgetRow,
} from "./budget-model";

export const getBudgetRows = cache(async (tripId: string, tripCurrency: string): Promise<BudgetRow[]> => {
  const supabase = await createClient();
  const [manualResult, accommodationResult, transportResult] = await Promise.all([
    supabase.from("budget_items").select("*").eq("trip_id", tripId),
    supabase.from("accommodations").select("*").eq("trip_id", tripId),
    supabase.from("transport_bookings").select("*").eq("trip_id", tripId),
  ]);
  const error = manualResult.error ?? accommodationResult.error ?? transportResult.error;
  if (error) throw error;
  return [
    ...(manualResult.data as BudgetItemRow[]).map(normalizeManualBudgetRow),
    ...(accommodationResult.data as AccommodationRow[]).map((item) => normalizeAccommodationBudgetRow(item, tripCurrency)),
    ...(transportResult.data as TransportBookingRow[]).map((item) => normalizeTransportBudgetRow(item, tripCurrency)),
  ].sort((left, right) => left.name.localeCompare(right.name, "cs") || left.id.localeCompare(right.id));
});
