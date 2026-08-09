"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

import { createClient } from "@/lib/supabase/server";

import { parseDestination, parseTripSettings } from "./trip-settings-input";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TripSettingsActionState = {
  error: "dates" | "invalid" | "save" | null;
};

const coverTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxCoverBytes = 5 * 1024 * 1024;

function settingsPath(tripId: string, key: "destination" | "settings", status: string) {
  const params = new URLSearchParams({ [key]: status });
  return uuidPattern.test(tripId)
    ? `/app/trips/${tripId}/settings?${params.toString()}`
    : `/app/trips?${params.toString()}`;
}

function revalidateTrip(tripId: string) {
  revalidatePath("/app/trips");
  revalidatePath("/app");
  revalidatePath(`/app/trips/${tripId}`);
  revalidatePath(`/app/trips/${tripId}/settings`);
}

function coverPath(tripId: string, status: string) {
  return `/app/trips/${tripId}/settings?cover=${status}`;
}

function coverExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  return "webp";
}

function validCover(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0 && file.size <= maxCoverBytes && coverTypes.has(file.type);
}

async function authenticatedClient(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`/login?next=/app/trips/${tripId}/settings`);
  }

  return supabase;
}

export async function updateTripSettings(
  _previousState: TripSettingsActionState,
  formData: FormData,
): Promise<TripSettingsActionState> {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const parsed = parseTripSettings(formData);

  if (!uuidPattern.test(tripId) || !parsed.success) {
    return { error: parsed.success ? "invalid" : parsed.error };
  }

  const supabase = await authenticatedClient(tripId);
  const { data: result, error } = await supabase.rpc("update_trip_settings", {
    target_trip_id: tripId,
    trip_cover_variant: parsed.data.coverVariant,
    trip_currency: parsed.data.currency,
    trip_description: parsed.data.description,
    trip_end_date: parsed.data.endDate,
    trip_name: parsed.data.name,
    trip_start_date: parsed.data.startDate,
    trip_status: parsed.data.status,
    trip_timezone: parsed.data.timezone,
  });

  if (error || result !== "updated") {
    return { error: "save" };
  }

  revalidateTrip(tripId);
  redirect(settingsPath(tripId, "settings", "saved"));
}

export async function uploadTripCover(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const file = formData.get("cover");
  if (!uuidPattern.test(tripId) || !validCover(file)) redirect(coverPath(tripId, "invalid"));

  const supabase = await authenticatedClient(tripId);
  const storagePath = `trips/${tripId}/cover/${randomUUID()}.${coverExtension(file)}`;
  const upload = await supabase.storage.from("trip-covers").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) redirect(coverPath(tripId, "upload-error"));

  const { data, error } = await supabase.rpc("set_trip_cover_upload", {
    target_storage_path: storagePath,
    target_trip_id: tripId,
  });
  if (error || data !== "updated") {
    await supabase.storage.from("trip-covers").remove([storagePath]);
    redirect(coverPath(tripId, "error"));
  }
  revalidateTrip(tripId);
  redirect(coverPath(tripId, "uploaded"));
}

export async function removeTripCover(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  if (!uuidPattern.test(tripId)) redirect(coverPath(tripId, "invalid"));
  const supabase = await authenticatedClient(tripId);
  const current = await supabase.from("trips").select("cover_storage_path").eq("id", tripId).maybeSingle();
  if (current.error || !current.data) redirect(coverPath(tripId, "error"));
  const { data, error } = await supabase.rpc("remove_trip_cover", { target_trip_id: tripId });
  if (error || data !== "updated") redirect(coverPath(tripId, "error"));
  if (current.data.cover_storage_path) await supabase.storage.from("trip-covers").remove([current.data.cover_storage_path]);
  revalidateTrip(tripId);
  redirect(coverPath(tripId, "removed"));
}

export async function addTripDestination(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const parsed = parseDestination(formData);

  if (!uuidPattern.test(tripId) || !parsed.success) {
    redirect(settingsPath(tripId, "destination", "invalid"));
  }

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("add_trip_destination", {
    destination_city: parsed.data.city,
    destination_continent: parsed.data.continent,
    destination_continent_overridden: parsed.data.continentOverridden,
    destination_country_code: parsed.data.countryCode,
    destination_country_name: parsed.data.countryName,
    target_trip_id: tripId,
  });

  if (error || !data) redirect(settingsPath(tripId, "destination", "error"));
  revalidateTrip(tripId);
  redirect(settingsPath(tripId, "destination", "added"));
}

export async function updateTripDestination(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const destinationId = formData.get("destinationId")?.toString().trim() ?? "";
  const parsed = parseDestination(formData);

  if (!uuidPattern.test(tripId) || !uuidPattern.test(destinationId) || !parsed.success) {
    redirect(settingsPath(tripId, "destination", "invalid"));
  }

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("update_trip_destination", {
    destination_city: parsed.data.city,
    destination_continent: parsed.data.continent,
    destination_continent_overridden: parsed.data.continentOverridden,
    destination_country_code: parsed.data.countryCode,
    destination_country_name: parsed.data.countryName,
    target_destination_id: destinationId,
  });

  if (error || data !== "updated") {
    redirect(settingsPath(tripId, "destination", "error"));
  }
  revalidateTrip(tripId);
  redirect(settingsPath(tripId, "destination", "updated"));
}

export async function setPrimaryTripDestination(formData: FormData) {
  return runDestinationCommand(formData, "set_primary_trip_destination", "primary");
}

export async function moveTripDestination(formData: FormData) {
  const rawDirection = formData.get("direction")?.toString();
  if (rawDirection !== "up" && rawDirection !== "down") {
    const tripId = formData.get("tripId")?.toString().trim() ?? "";
    redirect(settingsPath(tripId, "destination", "invalid"));
  }
  const direction = rawDirection === "up" ? -1 : 1;
  return runDestinationCommand(formData, "move_trip_destination", "moved", { direction });
}

export async function removeTripDestination(formData: FormData) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const destinationId = formData.get("destinationId")?.toString().trim() ?? "";

  if (!uuidPattern.test(tripId) || !uuidPattern.test(destinationId)) {
    redirect(settingsPath(tripId, "destination", "invalid"));
  }

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc("remove_trip_destination", {
    target_destination_id: destinationId,
  });

  if (error || !data) redirect(settingsPath(tripId, "destination", "error"));
  if (data !== "removed") {
    redirect(settingsPath(tripId, "destination", data.replaceAll("_", "-")));
  }
  revalidateTrip(tripId);
  redirect(settingsPath(tripId, "destination", "removed"));
}

async function runDestinationCommand(
  formData: FormData,
  functionName: "move_trip_destination" | "set_primary_trip_destination",
  successStatus: string,
  extraArgs: { direction: number } | Record<string, never> = {},
) {
  const tripId = formData.get("tripId")?.toString().trim() ?? "";
  const destinationId = formData.get("destinationId")?.toString().trim() ?? "";

  if (!uuidPattern.test(tripId) || !uuidPattern.test(destinationId)) {
    redirect(settingsPath(tripId, "destination", "invalid"));
  }

  const supabase = await authenticatedClient(tripId);
  const { data, error } = await supabase.rpc(functionName, {
    ...extraArgs,
    target_destination_id: destinationId,
  });

  if (error || !data) redirect(settingsPath(tripId, "destination", "error"));
  if (data === "boundary" || data === "no_change") {
    redirect(settingsPath(tripId, "destination", data.replaceAll("_", "-")));
  }

  revalidateTrip(tripId);
  redirect(settingsPath(tripId, "destination", successStatus));
}
