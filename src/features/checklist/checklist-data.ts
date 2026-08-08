import "server-only";

import { cache } from "react";
import type { PackingItemRow, TaskRow, TripTravelerRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { withTraveler, type ChecklistPackingItem, type ChecklistTask } from "./checklist-model";

export type ChecklistData = {
  currentTravelerId: string | null;
  packingItems: ChecklistPackingItem[];
  tasks: ChecklistTask[];
  travelers: TripTravelerRow[];
};

export const getChecklistData = cache(async (tripId: string, currentUserId: string): Promise<ChecklistData> => {
  const supabase = await createClient();
  const [taskResult, packingResult, travelerResult] = await Promise.all([
    supabase.from("tasks").select("*").eq("trip_id", tripId).order("due_date", { ascending: true, nullsFirst: false }).order("created_at"),
    supabase.from("packing_items").select("*").eq("trip_id", tripId).order("category").order("created_at"),
    supabase.from("trip_travelers").select("*").eq("trip_id", tripId).order("sort_order").order("created_at"),
  ]);
  const error = taskResult.error ?? packingResult.error ?? travelerResult.error;
  if (error) throw error;
  const travelers = travelerResult.data as TripTravelerRow[];
  return {
    currentTravelerId: travelers.find((traveler) => traveler.user_id === currentUserId)?.id ?? null,
    packingItems: (packingResult.data as PackingItemRow[]).map((item) => withTraveler(item, travelers)),
    tasks: (taskResult.data as TaskRow[]).map((task) => withTraveler(task, travelers)),
    travelers,
  };
});
