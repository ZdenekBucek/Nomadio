import { describe, expect, it } from "vitest";
import { documentSummary, filterDocuments, formatDocumentSize, linkedEntityLabel, type DocumentWithLink } from "./document-model";

const base = { category: "ticket", created_at: "2026-08-08T00:00:00Z", id: "a", is_important: true, linked_entity_id: null, linked_entity_type: null, mime_type: "application/pdf", name: "Letenka", offline_enabled: true, size_bytes: 2048, storage_path: "path", trip_id: "trip", updated_at: "2026-08-08T00:00:00Z", uploaded_by: "user", linkedEntityLabel: "Celá cesta" } satisfies DocumentWithLink;

describe("document model", () => {
  it("calculates summary and filters", () => {
    const items = [base, { ...base, id: "b", category: "insurance" as const, is_important: false, offline_enabled: false }];
    expect(documentSummary(items)).toEqual({ important: 1, offline: 1, total: 2 });
    expect(filterDocuments(items, "important")).toEqual([base]);
    expect(filterDocuments(items, "insurance")).toHaveLength(1);
  });

  it("formats sizes and linked labels", () => {
    expect(formatDocumentSize(2048)).toBe("2 kB");
    expect(linkedEntityLabel({ linked_entity_id: null, linked_entity_type: null }, new Map())).toBe("Celá cesta");
    expect(linkedEntityLabel({ linked_entity_id: "x", linked_entity_type: "transport" }, new Map([["transport:x", "Let Oslo"]]))).toBe("Let Oslo");
  });
});
