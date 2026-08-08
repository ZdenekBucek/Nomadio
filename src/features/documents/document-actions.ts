"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseDocumentMetadata, validateDocumentFile } from "./document-input";

function listPath(tripId: string, status?: string) {
  if (!isUuid(tripId)) return "/app/trips";
  return `/app/trips/${tripId}/documents${status ? `?documents=${status}` : ""}`;
}

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=${encodeURIComponent(listPath(tripId))}`);
  return { supabase, userId: data.user.id };
}

export async function uploadDocument(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const metadata = parseDocumentMetadata(formData);
  const file = await validateDocumentFile(formData.get("file"));
  if (!isUuid(tripId) || !metadata.success || !file.success) redirect(listPath(tripId, "invalid"));
  const { supabase, userId } = await authenticatedClient(tripId);
  const documentId = randomUUID();
  const storagePath = `trips/${tripId}/documents/${documentId}/${file.safeFilename}`;
  const uploadResult = await supabase.storage.from("trip-documents").upload(storagePath, file.file, {
    cacheControl: "3600",
    contentType: file.file.type,
    upsert: false,
  });
  if (uploadResult.error) redirect(listPath(tripId, "upload-error"));

  const { error } = await supabase.from("documents").insert({
    category: metadata.data.category,
    id: documentId,
    is_important: metadata.data.isImportant,
    linked_entity_id: metadata.data.linkedEntityId,
    linked_entity_type: metadata.data.linkedEntityType,
    mime_type: file.file.type,
    name: metadata.data.name,
    offline_enabled: metadata.data.offlineEnabled,
    size_bytes: file.file.size,
    storage_path: storagePath,
    trip_id: tripId,
    uploaded_by: userId,
  });
  if (error) {
    await supabase.storage.from("trip-documents").remove([storagePath]);
    redirect(listPath(tripId, "error"));
  }
  revalidatePath(listPath(tripId));
  redirect(listPath(tripId, "created"));
}

export async function updateDocumentMetadata(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const documentId = formData.get("documentId")?.toString().trim() ?? "";
  const metadata = parseDocumentMetadata(formData);
  if (!isUuid(tripId) || !isUuid(documentId) || !metadata.success) redirect(listPath(tripId, "invalid"));
  const { supabase } = await authenticatedClient(tripId);
  const { error } = await supabase.from("documents").update({
    category: metadata.data.category,
    is_important: metadata.data.isImportant,
    linked_entity_id: metadata.data.linkedEntityId,
    linked_entity_type: metadata.data.linkedEntityType,
    name: metadata.data.name,
    offline_enabled: metadata.data.offlineEnabled,
  }).eq("id", documentId).eq("trip_id", tripId);
  if (error) redirect(listPath(tripId, "error"));
  revalidatePath(listPath(tripId));
  revalidatePath(`${listPath(tripId)}/${documentId}`);
  redirect(`${listPath(tripId)}/${documentId}?documents=updated`);
}

export async function deleteDocument(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const documentId = formData.get("documentId")?.toString().trim() ?? "";
  if (!isUuid(tripId) || !isUuid(documentId)) redirect(listPath(tripId, "invalid"));
  const { supabase } = await authenticatedClient(tripId);
  const result = await supabase.from("documents").select("*").eq("id", documentId).eq("trip_id", tripId).maybeSingle();
  if (result.error || !result.data) redirect(listPath(tripId, "error"));
  const storageResult = await supabase.storage.from("trip-documents").remove([result.data.storage_path]);
  if (storageResult.error) redirect(listPath(tripId, "delete-error"));
  const { error } = await supabase.from("documents").delete().eq("id", documentId).eq("trip_id", tripId);
  if (error) redirect(listPath(tripId, "error"));
  revalidatePath(listPath(tripId));
  redirect(listPath(tripId, "removed"));
}
