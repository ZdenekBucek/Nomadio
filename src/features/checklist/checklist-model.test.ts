import { describe, expect, it } from "vitest";
import type { ChecklistPackingItem, ChecklistTask } from "./checklist-model";
import { filterPacking, filterTasks, summarizePacking, summarizeTasks } from "./checklist-model";

const base = { assigned_traveler_id: null, category: "preparation", created_at: "2027-01-01", created_by: "user", description: null, due_date: null, id: "one", linked_entity_id: null, linked_entity_type: null, priority: "normal", status: "todo", title: "Úkol", travelerName: null, trip_id: "trip", updated_at: "2027-01-01" } satisfies ChecklistTask;
const packing = { bag_type: "cabin", category: "electronics", created_at: "2027-01-01", created_by: "user", id: "packing", is_packed: false, name: "Adaptér", quantity: 1, traveler_id: "traveler", travelerName: "Zdeněk", trip_id: "trip", updated_at: "2027-01-01" } satisfies ChecklistPackingItem;

describe("checklist model", () => {
  it("summarizes completed and remaining tasks", () => { const tasks = [base, { ...base, id: "two", status: "completed" as const }, { ...base, id: "three", status: "cancelled" as const }]; expect(summarizeTasks(tasks)).toEqual({ completed: 1, remaining: 1, total: 3 }); });
  it("filters active, completed and current traveler tasks", () => { const tasks = [base, { ...base, assigned_traveler_id: "traveler", id: "two", status: "in_progress" as const }, { ...base, id: "three", status: "completed" as const }]; expect(filterTasks(tasks, "active", "traveler")).toHaveLength(2); expect(filterTasks(tasks, "completed", "traveler").map((task) => task.id)).toEqual(["three"]); expect(filterTasks(tasks, "mine", "traveler").map((task) => task.id)).toEqual(["two"]); });
  it("summarizes packed and remaining items independently", () => { expect(summarizePacking([packing, { ...packing, id: "packed", is_packed: true }])).toEqual({ packed: 1, remaining: 1, total: 2 }); });
  it("filters unpacked, packed and current traveler packing", () => { const items = [packing, { ...packing, id: "packed", is_packed: true, traveler_id: null }]; expect(filterPacking(items, "unpacked", "traveler").map((item) => item.id)).toEqual(["packing"]); expect(filterPacking(items, "packed", "traveler").map((item) => item.id)).toEqual(["packed"]); expect(filterPacking(items, "mine", "traveler").map((item) => item.id)).toEqual(["packing"]); });
});
