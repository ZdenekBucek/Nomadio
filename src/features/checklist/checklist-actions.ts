"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parsePackingItem, parseTask } from "./checklist-input";

function target(tripId: string, state: string) { return isUuid(tripId) ? `/app/trips/${tripId}/checklist?checklist=${state}` : "/app/trips"; }
async function authenticated(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/app/trips/${tripId}/checklist`);
  return { supabase, userId: data.user.id };
}
function ids(data: FormData, itemKey: string) { return { itemId: data.get(itemKey)?.toString().trim() ?? "", tripId: data.get("tripId")?.toString().trim() ?? "" }; }
function refresh(tripId: string) { revalidatePath(`/app/trips/${tripId}/checklist`); }

export async function createTask(data: FormData) {
  const tripId = data.get("tripId")?.toString().trim() ?? "";
  const parsed = parseTask(data);
  if (!isUuid(tripId) || !parsed.success) redirect(target(tripId, "invalid-task"));
  const { supabase, userId } = await authenticated(tripId);
  const { error } = await supabase.from("tasks").insert({ ...parsed.data, created_by: userId, trip_id: tripId });
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, "task-created"));
}

export async function updateTask(data: FormData) {
  const { itemId, tripId } = ids(data, "taskId"); const parsed = parseTask(data);
  if (!isUuid(tripId) || !isUuid(itemId) || !parsed.success) redirect(target(tripId, "invalid-task"));
  const { supabase } = await authenticated(tripId);
  const { error } = await supabase.from("tasks").update(parsed.data).eq("id", itemId).eq("trip_id", tripId);
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, "task-updated"));
}

export async function setTaskCompleted(data: FormData) {
  const { itemId, tripId } = ids(data, "taskId"); const completed = data.get("completed")?.toString() === "true";
  if (!isUuid(tripId) || !isUuid(itemId)) redirect(target(tripId, "invalid-task"));
  const { supabase } = await authenticated(tripId);
  const { error } = await supabase.from("tasks").update({ status: completed ? "completed" : "todo" }).eq("id", itemId).eq("trip_id", tripId);
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, completed ? "task-completed" : "task-reopened"));
}

export async function deleteTask(data: FormData) {
  const { itemId, tripId } = ids(data, "taskId");
  if (!isUuid(tripId) || !isUuid(itemId)) redirect(target(tripId, "invalid-task"));
  const { supabase } = await authenticated(tripId);
  const { error } = await supabase.from("tasks").delete().eq("id", itemId).eq("trip_id", tripId);
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, "task-removed"));
}

export async function createPackingItem(data: FormData) {
  const tripId = data.get("tripId")?.toString().trim() ?? ""; const parsed = parsePackingItem(data);
  if (!isUuid(tripId) || !parsed.success) redirect(target(tripId, "invalid-packing"));
  const { supabase, userId } = await authenticated(tripId);
  const { error } = await supabase.from("packing_items").insert({ ...parsed.data, created_by: userId, trip_id: tripId });
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, "packing-created"));
}

export async function updatePackingItem(data: FormData) {
  const { itemId, tripId } = ids(data, "packingItemId"); const parsed = parsePackingItem(data);
  if (!isUuid(tripId) || !isUuid(itemId) || !parsed.success) redirect(target(tripId, "invalid-packing"));
  const { supabase } = await authenticated(tripId);
  const { error } = await supabase.from("packing_items").update(parsed.data).eq("id", itemId).eq("trip_id", tripId);
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, "packing-updated"));
}

export async function setPackingItemPacked(data: FormData) {
  const { itemId, tripId } = ids(data, "packingItemId"); const packed = data.get("packed")?.toString() === "true";
  if (!isUuid(tripId) || !isUuid(itemId)) redirect(target(tripId, "invalid-packing"));
  const { supabase } = await authenticated(tripId);
  const { error } = await supabase.from("packing_items").update({ is_packed: packed }).eq("id", itemId).eq("trip_id", tripId);
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, packed ? "packed" : "unpacked"));
}

export async function deletePackingItem(data: FormData) {
  const { itemId, tripId } = ids(data, "packingItemId");
  if (!isUuid(tripId) || !isUuid(itemId)) redirect(target(tripId, "invalid-packing"));
  const { supabase } = await authenticated(tripId);
  const { error } = await supabase.from("packing_items").delete().eq("id", itemId).eq("trip_id", tripId);
  if (error) redirect(target(tripId, "error"));
  refresh(tripId); redirect(target(tripId, "packing-removed"));
}
