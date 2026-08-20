import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { resolveActiveEditableTrips, type ActiveEditableTrip } from "./active-trip-model";
export type { ActiveEditableTrip } from "./active-trip-model";

export const getActiveEditableTrips = cache(async (): Promise<ActiveEditableTrip[]> => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const [tripResult, memberResult] = await Promise.all([
    supabase.from("trips").select("id,name,currency,timezone,start_date,end_date,status").neq("status", "archived"),
    supabase.from("trip_members").select("trip_id,role,user_id").eq("user_id", userData.user.id),
  ]);
  if (tripResult.error || memberResult.error) return [];

  return resolveActiveEditableTrips(tripResult.data ?? [], memberResult.data ?? [], userData.user.id);
});
