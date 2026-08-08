import type { DocumentCategory, DocumentLinkedEntityType, DocumentRow } from "@/lib/supabase/database.types";

export const documentCategories: DocumentCategory[] = [
  "transport", "accommodation", "activity", "insurance", "visa", "ticket", "receipt", "other",
];

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  accommodation: "Ubytování",
  activity: "Aktivita",
  insurance: "Pojištění",
  other: "Ostatní",
  receipt: "Účtenka",
  ticket: "Vstupenka",
  transport: "Doprava",
  visa: "Víza",
};

export const documentLinkTypeLabels: Record<DocumentLinkedEntityType, string> = {
  accommodation: "Ubytování",
  itinerary_item: "Aktivita",
  transport: "Doprava",
  trip: "Celá cesta",
};

export type DocumentLinkOption = {
  id: string;
  label: string;
  type: Exclude<DocumentLinkedEntityType, "trip">;
};

export type DocumentWithLink = DocumentRow & { linkedEntityLabel: string };

export function formatDocumentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`;
}

export function documentTypeLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  return mimeType;
}

export function documentSummary(items: DocumentRow[]) {
  return {
    important: items.filter((item) => item.is_important).length,
    offline: items.filter((item) => item.offline_enabled).length,
    total: items.length,
  };
}

export function filterDocuments(
  items: DocumentWithLink[],
  filter: "all" | "important" | DocumentCategory,
) {
  if (filter === "all") return items;
  if (filter === "important") return items.filter((item) => item.is_important);
  return items.filter((item) => item.category === filter);
}

export function linkedEntityLabel(
  item: Pick<DocumentRow, "linked_entity_id" | "linked_entity_type">,
  labels: Map<string, string>,
) {
  if (!item.linked_entity_type || !item.linked_entity_id) return "Celá cesta";
  return labels.get(`${item.linked_entity_type}:${item.linked_entity_id}`)
    ?? documentLinkTypeLabels[item.linked_entity_type];
}
