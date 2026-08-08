import { describe, expect, it } from "vitest";
import { parsePackingItem, parseTask } from "./checklist-input";

function task() { const data = new FormData(); data.set("title", "Doplatit hotel"); data.set("category", "payment"); data.set("status", "todo"); data.set("priority", "high"); return data; }

describe("checklist input", () => {
  it("parses task priority, due date and traveler", () => { const data = task(); data.set("dueDate", "2027-05-15"); data.set("assignedTravelerId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"); const result = parseTask(data); expect(result.success && result.data).toMatchObject({ due_date: "2027-05-15", priority: "high", assigned_traveler_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }); });
  it("rejects an invalid traveler", () => { const data = task(); data.set("assignedTravelerId", "outside-trip"); expect(parseTask(data).success).toBe(false); });
  it("requires a complete linked entity pair", () => { const data = task(); data.set("linkedEntityType", "document"); expect(parseTask(data).success).toBe(false); });
  it("parses packing quantity, category and bag", () => { const data = new FormData(); data.set("name", "Adaptér"); data.set("category", "electronics"); data.set("quantity", "2"); data.set("bagType", "cabin"); const result = parsePackingItem(data); expect(result.success && result.data).toMatchObject({ bag_type: "cabin", category: "electronics", quantity: 2 }); });
  it("rejects invalid packing quantity", () => { const data = new FormData(); data.set("name", "Pas"); data.set("category", "documents"); data.set("quantity", "0"); expect(parsePackingItem(data).success).toBe(false); });
});
