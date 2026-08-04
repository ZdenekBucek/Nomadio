import type { PlaceCategory } from "@/lib/supabase/database.types";

export type MapboxPlaceResult = {
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

type SearchOptions = {
  accessToken: string;
  countryCodes?: string[];
  fetcher?: typeof fetch;
  query: string;
};

type UnknownRecord = Record<string, unknown>;

export class MapboxSearchError extends Error {
  constructor(public readonly status: number) {
    super("Mapbox search failed");
    this.name = "MapboxSearchError";
  }
}

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function limitedText(value: unknown, length: number): string | null {
  const result = text(value);
  return result ? result.slice(0, length) : null;
}

function contextName(context: UnknownRecord | null, key: string): string | null {
  return text(record(context?.[key])?.name);
}

function categoryFor(properties: UnknownRecord, featureType: string): PlaceCategory {
  const categoryIds = Array.isArray(properties.poi_category_ids)
    ? properties.poi_category_ids.filter((value): value is string => typeof value === "string")
    : [];
  const categories = `${featureType} ${categoryIds.join(" ")}`.toLowerCase();
  if (/charging|ev[_ -]?charger|electric[_ -]?vehicle/.test(categories)) return "charging";
  if (/hotel|hostel|lodging|camp/.test(categories)) return "accommodation";
  if (/restaurant|cafe|coffee|food|bar|bakery/.test(categories)) return "food";
  if (/airport|station|transit|parking|ferry/.test(categories)) return "transport";
  if (/shop|store|mall|market/.test(categories)) return "shopping";
  if (/park|garden|beach|mountain|nature/.test(categories)) return "nature";
  if (/museum|monument|historic|landmark|attraction/.test(categories)) return "sight";
  if (featureType === "poi") return "activity";
  return "custom";
}

export function normalizeMapboxResponse(payload: unknown): MapboxPlaceResult[] {
  const features = record(payload)?.features;
  if (!Array.isArray(features)) return [];

  return features.flatMap((candidate) => {
    const feature = record(candidate);
    const properties = record(feature?.properties);
    if (!properties) return [];
    const context = record(properties?.context);
    const geometry = record(feature?.geometry);
    const coordinateProperties = record(properties?.coordinates);
    const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
    const longitude =
      typeof coordinateProperties?.longitude === "number"
        ? coordinateProperties.longitude
        : coordinates[0];
    const latitude =
      typeof coordinateProperties?.latitude === "number"
        ? coordinateProperties.latitude
        : coordinates[1];
    const providerPlaceId = limitedText(properties?.mapbox_id, 240) ?? limitedText(feature?.id, 240);
    const name = limitedText(properties?.name_preferred, 160) ?? limitedText(properties?.name, 160);
    const providerCategory = limitedText(properties?.feature_type, 160) ?? limitedText(feature?.type, 160) ?? "place";

    if (
      !providerPlaceId ||
      !name ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return [];
    }

    const rawCountryCode = text(record(context?.country)?.country_code)?.toUpperCase() ?? null;
    return [{
      address: limitedText(properties?.full_address, 300) ?? limitedText(properties?.place_formatted, 300),
      category: categoryFor(properties, providerCategory),
      city:
        contextName(context, "place") ??
        contextName(context, "locality") ??
        contextName(context, "district")?.slice(0, 120) ?? null,
      countryCode: rawCountryCode && /^[A-Z]{2}$/.test(rawCountryCode) ? rawCountryCode : null,
      latitude,
      longitude,
      name,
      providerCategory,
      providerPlaceId,
    }];
  });
}

export async function searchMapboxPlaces({
  accessToken,
  countryCodes = [],
  fetcher = fetch,
  query,
}: SearchOptions): Promise<MapboxPlaceResult[]> {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("permanent", "true");
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("language", "cs");
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "address,street,place,locality,neighborhood,district,region,country");
  const countries = [...new Set(countryCodes.map((code) => code.trim().toLowerCase()).filter((code) => /^[a-z]{2}$/.test(code)))];
  if (countries.length) url.searchParams.set("country", countries.join(","));

  const response = await fetcher(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new MapboxSearchError(response.status);
  return normalizeMapboxResponse(await response.json());
}
