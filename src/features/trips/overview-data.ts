import "server-only";
import { getAccommodations } from "@/features/accommodation/accommodation-data";
import { getBudgetRows } from "@/features/budget/budget-data";
import { getChecklistData } from "@/features/checklist/checklist-data";
import { getDocumentsPageData } from "@/features/documents/document-data";
import { getItineraryDays } from "@/features/itinerary/itinerary-data";
import { getTransportBookings } from "@/features/transport/transport-data";
import { createClient } from "@/lib/supabase/server";
import { buildTripOverview } from "./overview-model";

export async function getTripOverviewData(trip: { currency: string; end_date: string | null; id: string; start_date: string | null }, currentUserId: string) {
  const [accommodations, budget, checklist, documents, itineraryDays, transport] = await Promise.all([
    getAccommodations(trip.id), getBudgetRows(trip.id, trip.currency), getChecklistData(trip.id, currentUserId), getDocumentsPageData(trip.id), getItineraryDays(trip.id), getTransportBookings(trip.id),
  ]);
  const supabase = await createClient();
  const itemResult = itineraryDays.length ? await supabase.from("itinerary_items").select("*").in("day_id", itineraryDays.map((day) => day.id)).order("sort_order") : { data: [], error: null };
  if (itemResult.error) throw itemResult.error;
  return buildTripOverview({ accommodations, budget, documents: documents.documents, itineraryDays, itineraryItems: itemResult.data ?? [], packingItems: checklist.packingItems, tasks: checklist.tasks, transport, tripEnd: trip.end_date, tripId: trip.id, tripStart: trip.start_date });
}
