import { isPlaceCategory } from "@/features/places/categories";
import { GEOAPIFY_ATTRIBUTION } from "@/features/places/geoapify";
import type { PlaceProvider } from "@/features/places/place-search-result";
import type { PlaceCategory } from "@/lib/supabase/database.types";

type ExternalPlaceInput = {
  address: string;
  attribution: string;
  category: PlaceCategory;
  city: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  name: string;
  provider: PlaceProvider;
  providerCategory: string;
  providerPlaceId: string;
  suggestedCategory: PlaceCategory;
};

type Result = { data: ExternalPlaceInput; success: true } | { success: false };

function value(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

export function parseExternalPlace(formData: FormData): Result {
  const provider = value(formData, "provider");
  const providerPlaceId = value(formData, "providerPlaceId");
  const providerCategory = value(formData, "providerCategory");
  const name = value(formData, "name");
  const address = value(formData, "address");
  const city = value(formData, "city") || null;
  const countryCode = value(formData, "countryCode").toUpperCase() || null;
  const latitude = Number(value(formData, "latitude"));
  const longitude = Number(value(formData, "longitude"));
  const category = value(formData, "category");
  const suggestedCategory = value(formData, "suggestedCategory");
  const attribution = value(formData, "attribution");

  if (
    (provider !== "geoapify" && provider !== "mapbox")
    || providerPlaceId.length < 1 || providerPlaceId.length > 240
    || providerCategory.length < 1 || providerCategory.length > 160
    || name.length < 1 || name.length > 160
    || address.length < 1 || address.length > 300
    || (city?.length ?? 0) > 120
    || (countryCode !== null && !/^[A-Z]{2}$/.test(countryCode))
    || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || !isPlaceCategory(category) || !isPlaceCategory(suggestedCategory)
    || attribution.length < 1 || attribution.length > 300
    || (provider === "geoapify" && attribution !== GEOAPIFY_ATTRIBUTION)
  ) return { success: false };

  return {
    success: true,
    data: {
      address,
      attribution,
      category,
      city,
      countryCode,
      latitude,
      longitude,
      name,
      provider,
      providerCategory,
      providerPlaceId,
      suggestedCategory,
    },
  };
}
