import "server-only";

import { cache } from "react";

import { getAuthenticatedProfile } from "@/features/auth/session";
import type {
  TripDestinationRow,
  TripMemberProfileRow,
  TripRow,
  TripTravelerRow,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type TripDetail = {
  currentUserId: string;
  destinations: TripDestinationRow[];
  members: TripMemberProfileRow[];
  travelers: TripTravelerRow[];
  trip: TripRow;
  userQuickExpenseFabEnabled: boolean;
};

export const getTripDetail = cache(async (tripId: string): Promise<TripDetail | null> => {
  const auth = await getAuthenticatedProfile();
  if (!auth) return null;

  const supabase = await createClient();
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (tripError) throw tripError;
  if (!trip) return null;

  const [destinationResult, travelerResult, memberResult] = await Promise.all([
    supabase
      .from("trip_destinations")
      .select("*")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trip_travelers")
      .select("*")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: true }),
    supabase.rpc("list_trip_members", { target_trip_id: tripId }),
  ]);

  const relatedError =
    destinationResult.error ?? travelerResult.error ?? memberResult.error;
  if (relatedError) throw relatedError;

  return {
    currentUserId: auth.id,
    destinations: destinationResult.data ?? [],
    members: memberResult.data ?? [],
    travelers: travelerResult.data ?? [],
    trip,
    userQuickExpenseFabEnabled: auth.profile.quickExpenseFabEnabled,
  };
});
