import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteEnd: vi.fn(), getUser: vi.fn(), insert: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }), revalidate: vi.fn(), updateEnd: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser }, from: vi.fn(() => ({ delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: mocks.deleteEnd })) })), insert: mocks.insert, update: mocks.update })) })) }));
import { createPackingItem, createTask, deleteTask, setPackingItemPacked, setTaskCompleted, updateTask } from "./checklist-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function taskForm() { const data = new FormData(); data.set("tripId", tripId); data.set("title", "Doplatit hotel"); data.set("category", "payment"); data.set("status", "todo"); data.set("priority", "high"); return data; }
function updateChain() { return { eq: vi.fn(() => ({ eq: mocks.updateEnd })) }; }

describe("checklist actions", () => {
  beforeEach(() => { mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } }); mocks.insert.mockReset().mockResolvedValue({ error: null }); mocks.updateEnd.mockReset().mockResolvedValue({ error: null }); mocks.deleteEnd.mockReset().mockResolvedValue({ error: null }); mocks.update.mockReset().mockImplementation(() => updateChain()); mocks.revalidate.mockReset(); mocks.redirect.mockClear(); });
  it("creates a normalized task", async () => { await expect(createTask(taskForm())).rejects.toThrow("task-created"); expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: "user", priority: "high", trip_id: tripId })); });
  it("edits and completes a task", async () => { const edit = taskForm(); edit.set("taskId", itemId); await expect(updateTask(edit)).rejects.toThrow("task-updated"); expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Doplatit hotel" })); const complete = new FormData(); complete.set("tripId", tripId); complete.set("taskId", itemId); complete.set("completed", "true"); await expect(setTaskCompleted(complete)).rejects.toThrow("task-completed"); expect(mocks.update).toHaveBeenLastCalledWith({ status: "completed" }); });
  it("deletes a trip-scoped task", async () => { const data = new FormData(); data.set("tripId", tripId); data.set("taskId", itemId); await expect(deleteTask(data)).rejects.toThrow("task-removed"); expect(mocks.deleteEnd).toHaveBeenCalledWith("trip_id", tripId); });
  it("creates and packs a packing item", async () => { const data = new FormData(); data.set("tripId", tripId); data.set("name", "Pas"); data.set("category", "documents"); data.set("quantity", "1"); await expect(createPackingItem(data)).rejects.toThrow("packing-created"); expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ category: "documents", quantity: 1 })); const packed = new FormData(); packed.set("tripId", tripId); packed.set("packingItemId", itemId); packed.set("packed", "true"); await expect(setPackingItemPacked(packed)).rejects.toThrow("checklist=packed"); expect(mocks.update).toHaveBeenLastCalledWith({ is_packed: true }); });
});
