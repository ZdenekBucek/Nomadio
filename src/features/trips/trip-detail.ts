import "server-only";

import { cache } from "react";

import { getAuthenticatedProfile } from "@/features/auth/session";
import type {
  TripDestinationRow,
  TripMemberRow,
  TripRow,
  TripTravelerRow,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type TripDetail = {
  currentUserId: string;
  destinations: TripDestinationRow[];
  members: TripMemberRow[];
  travelers: TripTravelerRow[];
  trip: TripRow;
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
    supabase
      .from("trip_members")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true }),
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
  };
});
