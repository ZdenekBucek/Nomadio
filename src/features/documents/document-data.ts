import "server-only";

import type { AccommodationRow, DocumentRow, ItineraryDayRow, ItineraryItemRow, TransportBookingRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { linkedEntityLabel, type DocumentLinkOption, type DocumentWithLink } from "./document-model";

export type DocumentsPageData = {
  documents: DocumentWithLink[];
  linkOptions: DocumentLinkOption[];
};

export async function getDocumentsPageData(tripId: string): Promise<DocumentsPageData> {
  const supabase = await createClient();
  const [documentsResult, accommodationsResult, transportResult, daysResult] = await Promise.all([
    supabase.from("documents").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }),
    supabase.from("accommodations").select("*").eq("trip_id", tripId),
    supabase.from("transport_bookings").select("*").eq("trip_id", tripId),
    supabase.from("itinerary_days").select("*").eq("trip_id", tripId),
  ]);
  for (const result of [documentsResult, accommodationsResult, transportResult, daysResult]) {
    if (result.error) throw result.error;
  }
  const days = daysResult.data as ItineraryDayRow[];
  const itemResult = days.length
    ? await supabase.from("itinerary_items").select("*").in("day_id", days.map((day) => day.id)).eq("item_type", "activity")
    : { data: [], error: null };
  if (itemResult.error) throw itemResult.error;

  const options: DocumentLinkOption[] = [
    ...(accommodationsResult.data as AccommodationRow[]).map((item) => ({ id: item.id, label: item.name, type: "accommodation" as const })),
    ...(transportResult.data as TransportBookingRow[]).map((item) => ({ id: item.id, label: item.title, type: "transport" as const })),
    ...(itemResult.data as ItineraryItemRow[]).map((item) => ({ id: item.id, label: item.title, type: "itinerary_item" as const })),
  ];
  const labels = new Map(options.map((option) => [`${option.type}:${option.id}`, option.label]));
  return {
    documents: (documentsResult.data as DocumentRow[]).map((item) => ({
      ...item,
      linkedEntityLabel: linkedEntityLabel(item, labels),
    })),
    linkOptions: options,
  };
}

export async function getDocumentDetail(tripId: string, documentId: string) {
  const supabase = await createClient();
  const { documents, linkOptions } = await getDocumentsPageData(tripId);
  const document = documents.find((item) => item.id === documentId) ?? null;
  if (!document) return null;
  const signedResult = await supabase.storage.from("trip-documents").createSignedUrl(document.storage_path, 300);
  return { document, linkOptions, signedUrl: signedResult.data?.signedUrl ?? null };
}
