import type { PlaceCategory } from "@/lib/supabase/database.types";
import { isPlaceCategory } from "@/features/places/categories";

export type MapboxPlaceInput = {
  address: string | null;
  category: PlaceCategory;
  city: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  name: string;
  providerCategory: string;
  providerPlaceId: string;
};

type Result = { data: MapboxPlaceInput; success: true } | { success: false };
function required(formData: FormData, key: string) { return formData.get(key)?.toString().trim() ?? ""; }
function optional(formData: FormData, key: string) { return required(formData, key) || null; }

export function parseMapboxPlace(formData: FormData): Result {
  const providerPlaceId = required(formData, "providerPlaceId");
  const providerCategory = required(formData, "providerCategory");
  const name = required(formData, "name");
  const address = optional(formData, "address");
  const city = optional(formData, "city");
  const countryCode = optional(formData, "countryCode")?.toUpperCase() ?? null;
  const latitude = Number(required(formData, "latitude"));
  const longitude = Number(required(formData, "longitude"));
  const category = required(formData, "category") as PlaceCategory;
  if (
    providerPlaceId.length < 1 || providerPlaceId.length > 240 ||
    providerCategory.length < 1 || providerCategory.length > 160 ||
    name.length < 1 || name.length > 160 ||
    (address?.length ?? 0) > 300 || (city?.length ?? 0) > 120 ||
    (countryCode !== null && !/^[A-Z]{2}$/.test(countryCode)) ||
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    !isPlaceCategory(category)
  ) return { success: false };
  return { success: true, data: { address, category, city, countryCode, latitude, longitude, name, providerCategory, providerPlaceId } };
}
