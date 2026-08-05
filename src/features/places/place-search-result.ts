import type { PlaceCategory } from "@/lib/supabase/database.types";

export type PlaceProvider = "geoapify" | "mapbox";

export type PlaceSearchResult = {
  attribution: string;
  category: PlaceCategory;
  city: string | null;
  countryCode: string | null;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  name: string;
  provider: PlaceProvider;
  providerCategories: string[];
  providerPlaceId: string;
};
