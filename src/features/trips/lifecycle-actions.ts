"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TripDeletionActionState = {
  error: "delete" | "invalid" | "mismatch" | null;
};

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`/login?next=/app/trips/${tripId}/settings`);
  }

  return supabase;
}

function revalidateTrip(tripId: string) {
  revalidatePath("/app/trips");
  revalidatePath(`/app/trips/${tripId}`);
  revalidatePath(`/app/trips/${tripId}/settings`);
}

export async function archiveTrip(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId)) redirect("/app/trips?error=lifecycle");

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("archive_trip", { target_trip_id: tripId });
  if (error || !data) redirect(`/app/trips/${tripId}/settings?lifecycle=error`);

  revalidateTrip(tripId);
  redirect("/app/trips?filter=archive&lifecycle=archived");
}

export async function restoreTrip(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId)) redirect("/app/trips?error=lifecycle");

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("restore_trip", { target_trip_id: tripId });
  if (error || !data || data === "not_archived") {
    redirect(`/app/trips/${tripId}/settings?lifecycle=error`);
  }

  revalidateTrip(tripId);
  redirect("/app/trips?filter=all&lifecycle=restored");
}

export async function deleteTrip(
  _previousState: TripDeletionActionState,
  formData: FormData,
): Promise<TripDeletionActionState> {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const confirmationName = formData.get("confirmationName")?.toString().trim() ?? "";

  if (!uuidPattern.test(tripId) || confirmationName.length < 1 || confirmationName.length > 120) {
    return { error: "invalid" };
  }

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("delete_trip", {
    confirmation_name: confirmationName,
    target_trip_id: tripId,
  });

  if (error || !data) return { error: "delete" };
  if (data === "name_mismatch") return { error: "mismatch" };

  revalidateTrip(tripId);
  redirect("/app/trips?filter=all&lifecycle=deleted");
}
