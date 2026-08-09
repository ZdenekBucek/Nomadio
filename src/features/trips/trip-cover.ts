import type { TripCoverVariant, TripRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type TripCover = {
  imageUrl: string | null;
  variant: TripCoverVariant;
};

type CoverSource = Pick<TripRow, "cover_kind" | "cover_storage_path" | "cover_url" | "cover_variant">;

/** Resolves only short-lived URLs; no signed URL is persisted in trip metadata. */
export async function getTripCover(trip: CoverSource): Promise<TripCover> {
  if (trip.cover_kind === "remote" && trip.cover_url) {
    return { imageUrl: trip.cover_url, variant: trip.cover_variant };
  }
  if (trip.cover_kind !== "upload" || !trip.cover_storage_path) {
    return { imageUrl: null, variant: trip.cover_variant };
  }

  const supabase = await createClient();
  const result = await supabase.storage.from("trip-covers").createSignedUrl(trip.cover_storage_path, 300);
  return { imageUrl: result.data?.signedUrl ?? null, variant: trip.cover_variant };
}
