import { isPlaceCategory } from "./categories";
import type { PlaceCategory } from "@/lib/supabase/database.types";

export type MapPlaceInput = {
  address: string | null;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  name: string;
  notes: string | null;
};

type Result = { data: MapPlaceInput; success: true } | { success: false };

export function parseMapPlace(formData: FormData): Result {
  const name = formData.get("name")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString() ?? "";
  const notes = formData.get("notes")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;
  const rawLatitude = formData.get("latitude")?.toString().trim() ?? "";
  const rawLongitude = formData.get("longitude")?.toString().trim() ?? "";
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  if (
    name.length < 1 || name.length > 160 || !isPlaceCategory(category)
    || (notes?.length ?? 0) > 1200 || (address?.length ?? 0) > 300 || !rawLatitude || !rawLongitude || !Number.isFinite(latitude)
    || latitude < -90 || latitude > 90 || !Number.isFinite(longitude)
    || longitude < -180 || longitude > 180
  ) return { success: false };
  return { data: { address, category, latitude, longitude, name, notes }, success: true };
}
