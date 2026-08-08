import type { PackingBagType, PackingCategory, TaskCategory, TaskLinkedEntityType, TaskPriority, TaskStatus } from "@/lib/supabase/database.types";
import { packingBagTypes, packingCategories, taskCategories, taskPriorities, taskStatuses } from "./checklist-model";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const linkedTypes: TaskLinkedEntityType[] = ["accommodation", "transport", "document", "itinerary_item"];

function optional(data: FormData, key: string) {
  const value = data.get(key)?.toString().trim() ?? "";
  return value || null;
}

export function isUuid(value: string) { return uuidPattern.test(value); }

export function parseTask(data: FormData) {
  const title = data.get("title")?.toString().trim() ?? "";
  const description = optional(data, "description");
  const category = data.get("category")?.toString() ?? "";
  const status = data.get("status")?.toString() ?? "";
  const priority = data.get("priority")?.toString() ?? "";
  const dueDate = optional(data, "dueDate");
  const travelerId = optional(data, "assignedTravelerId");
  const linkedType = optional(data, "linkedEntityType");
  const linkedId = optional(data, "linkedEntityId");
  if (title.length < 1 || title.length > 200 || (description !== null && description.length > 4000)
    || !taskCategories.includes(category as TaskCategory) || !taskStatuses.includes(status as TaskStatus)
    || !taskPriorities.includes(priority as TaskPriority) || (dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    || (travelerId !== null && !isUuid(travelerId)) || ((linkedType === null) !== (linkedId === null))
    || (linkedType !== null && !linkedTypes.includes(linkedType as TaskLinkedEntityType))
    || (linkedId !== null && !isUuid(linkedId))) return { success: false } as const;
  return { success: true, data: { assigned_traveler_id: travelerId, category: category as TaskCategory, description, due_date: dueDate, linked_entity_id: linkedId, linked_entity_type: linkedType as TaskLinkedEntityType | null, priority: priority as TaskPriority, status: status as TaskStatus, title } } as const;
}

export function parsePackingItem(data: FormData) {
  const name = data.get("name")?.toString().trim() ?? "";
  const category = data.get("category")?.toString() ?? "";
  const travelerId = optional(data, "travelerId");
  const bagType = optional(data, "bagType");
  const rawQuantity = optional(data, "quantity");
  const quantity = rawQuantity === null ? null : Number(rawQuantity);
  if (name.length < 1 || name.length > 160 || !packingCategories.includes(category as PackingCategory)
    || (travelerId !== null && !isUuid(travelerId)) || (bagType !== null && !packingBagTypes.includes(bagType as PackingBagType))
    || (quantity !== null && (!Number.isInteger(quantity) || quantity < 1 || quantity > 999))) return { success: false } as const;
  return { success: true, data: { bag_type: bagType as PackingBagType | null, category: category as PackingCategory, name, quantity, traveler_id: travelerId } } as const;
}
