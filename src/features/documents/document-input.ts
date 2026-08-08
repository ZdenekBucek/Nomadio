import type { DocumentCategory, DocumentLinkedEntityType } from "@/lib/supabase/database.types";
import { documentCategories } from "./document-model";

export const maxDocumentSizeBytes = 10 * 1024 * 1024;
export const allowedDocumentMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const linkTypes: DocumentLinkedEntityType[] = ["accommodation", "transport", "itinerary_item", "trip"];

export type DocumentMetadataInput = {
  category: DocumentCategory;
  isImportant: boolean;
  linkedEntityId: string | null;
  linkedEntityType: DocumentLinkedEntityType | null;
  name: string;
  offlineEnabled: boolean;
};

type ParseResult<T> = { success: true; data: T } | { success: false };

function checkbox(formData: FormData, name: string) {
  return formData.get(name)?.toString() === "on";
}

export function parseDocumentMetadata(formData: FormData): ParseResult<DocumentMetadataInput> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString() ?? "";
  const link = formData.get("linkedEntity")?.toString().trim() ?? "";
  let linkedEntityType: DocumentLinkedEntityType | null = null;
  let linkedEntityId: string | null = null;

  if (link) {
    const separator = link.indexOf(":");
    const type = link.slice(0, separator) as DocumentLinkedEntityType;
    const id = link.slice(separator + 1);
    if (separator < 1 || !linkTypes.includes(type) || !uuidPattern.test(id)) return { success: false };
    linkedEntityType = type;
    linkedEntityId = id;
  }

  if (!name || name.length > 200 || !documentCategories.includes(category as DocumentCategory)) {
    return { success: false };
  }

  return {
    success: true,
    data: {
      category: category as DocumentCategory,
      isImportant: checkbox(formData, "isImportant"),
      linkedEntityId,
      linkedEntityType,
      name,
      offlineEnabled: checkbox(formData, "offlineEnabled"),
    },
  };
}

export async function validateDocumentFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size < 1 || value.size > maxDocumentSizeBytes) {
    return { success: false as const };
  }
  if (!allowedDocumentMimeTypes.includes(value.type as (typeof allowedDocumentMimeTypes)[number])) {
    return { success: false as const };
  }
  const bytes = new Uint8Array(await value.slice(0, 8).arrayBuffer());
  const signatureValid = value.type === "application/pdf"
    ? bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
    : value.type === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
        && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (!signatureValid) return { success: false as const };
  return { success: true as const, file: value, safeFilename: safeDocumentFilename(value.name, value.type) };
}

export function safeDocumentFilename(originalName: string, mimeType: string) {
  const extension = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg";
  const base = originalName.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "document";
  return `${base}.${extension}`;
}

export function isUuid(value: string) {
  return uuidPattern.test(value);
}
