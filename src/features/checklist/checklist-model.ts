import type {
  PackingBagType,
  PackingCategory,
  PackingItemRow,
  TaskCategory,
  TaskPriority,
  TaskRow,
  TaskStatus,
  TripTravelerRow,
} from "@/lib/supabase/database.types";

export const taskCategories: TaskCategory[] = ["preparation", "booking", "payment", "document", "packing", "during_trip", "after_trip", "other"];
export const taskStatuses: TaskStatus[] = ["todo", "in_progress", "completed", "cancelled"];
export const taskPriorities: TaskPriority[] = ["low", "normal", "high"];
export const packingCategories: PackingCategory[] = ["documents", "electronics", "clothing", "hygiene", "medicine", "flight", "other"];
export const packingBagTypes: PackingBagType[] = ["cabin", "checked", "personal", "shared"];

export const taskCategoryLabels: Record<TaskCategory, string> = {
  preparation: "Příprava", booking: "Rezervace", payment: "Platby", document: "Dokumenty",
  packing: "Balení", during_trip: "Během cesty", after_trip: "Po návratu", other: "Ostatní",
};
export const taskStatusLabels: Record<TaskStatus, string> = { todo: "Čeká", in_progress: "Probíhá", completed: "Hotovo", cancelled: "Zrušeno" };
export const taskPriorityLabels: Record<TaskPriority, string> = { low: "Nízká", normal: "Běžná", high: "Vysoká" };
export const packingCategoryLabels: Record<PackingCategory, string> = { documents: "Dokumenty", electronics: "Elektronika", clothing: "Oblečení", hygiene: "Hygiena", medicine: "Léky", flight: "Do letadla", other: "Ostatní" };
export const packingBagTypeLabels: Record<PackingBagType, string> = { cabin: "Příruční zavazadlo", checked: "Odbavené zavazadlo", personal: "Osobní taška", shared: "Společné" };

export type ChecklistTask = TaskRow & { travelerName: string | null };
export type ChecklistPackingItem = PackingItemRow & { travelerName: string | null };
export type TaskFilter = "all" | "active" | "completed" | "mine";
export type PackingFilter = "all" | "unpacked" | "packed" | "mine";

export function withTraveler<T extends TaskRow | PackingItemRow>(row: T, travelers: TripTravelerRow[]) {
  const travelerId = "assigned_traveler_id" in row ? row.assigned_traveler_id : row.traveler_id;
  return { ...row, travelerName: travelers.find((traveler) => traveler.id === travelerId)?.display_name ?? null };
}

export function summarizeTasks(tasks: TaskRow[]) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  return { completed, remaining: tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").length, total: tasks.length };
}

export function summarizePacking(items: PackingItemRow[]) {
  const packed = items.filter((item) => item.is_packed).length;
  return { packed, remaining: items.length - packed, total: items.length };
}

export function filterTasks(tasks: ChecklistTask[], filter: TaskFilter, currentTravelerId: string | null) {
  if (filter === "active") return tasks.filter((task) => task.status === "todo" || task.status === "in_progress");
  if (filter === "completed") return tasks.filter((task) => task.status === "completed");
  if (filter === "mine") return currentTravelerId ? tasks.filter((task) => task.assigned_traveler_id === currentTravelerId) : [];
  return tasks;
}

export function filterPacking(items: ChecklistPackingItem[], filter: PackingFilter, currentTravelerId: string | null) {
  if (filter === "unpacked") return items.filter((item) => !item.is_packed);
  if (filter === "packed") return items.filter((item) => item.is_packed);
  if (filter === "mine") return currentTravelerId ? items.filter((item) => item.traveler_id === currentTravelerId) : [];
  return items;
}
