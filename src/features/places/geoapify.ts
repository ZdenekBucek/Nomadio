import { categoryForGeoapify } from "./categories";
import type { PlaceSearchResult } from "./place-search-result";

type UnknownRecord = Record<string, unknown>;

type SearchOptions = {
  apiKey: string;
  countryCodes?: string[];
  fetcher?: typeof fetch;
  query: string;
  timeoutMs?: number;
};

type ReverseOptions = {
  apiKey: string;
  fetcher?: typeof fetch;
  latitude: number;
  longitude: number;
  timeoutMs?: number;
};

export const GEOAPIFY_ATTRIBUTION = "Powered by Geoapify · © OpenStreetMap contributors";

export class GeoapifySearchError extends Error {
  constructor(public readonly kind: "provider" | "timeout", public readonly status?: number) {
    super("Geoapify search failed");
    this.name = "GeoapifySearchError";
  }
}

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function limitedText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function categories(properties: UnknownRecord) {
  const list = Array.isArray(properties.categories) ? properties.categories : [];
  const values = list.filter((value): value is string => typeof value === "string");
  const category = limitedText(properties.category, 160);
  if (category) values.push(category);
  const resultType = limitedText(properties.result_type, 160);
  if (resultType) values.push(resultType);
  return [...new Set(values.map((value) => value.trim().slice(0, 160)).filter(Boolean))].slice(0, 12);
}

function candidateProperties(candidate: unknown) {
  const item = record(candidate);
  return record(item?.properties) ?? item;
}

export function normalizeGeoapifyResponse(payload: unknown): PlaceSearchResult[] {
  const root = record(payload);
  const candidates = Array.isArray(root?.features)
    ? root.features
    : Array.isArray(root?.results)
      ? root.results
      : [];

  return candidates.flatMap((candidate) => {
    const item = record(candidate);
    const properties = candidateProperties(candidate);
    if (!properties) return [];
    const geometry = record(item?.geometry);
    const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
    const latitude = typeof properties.lat === "number" ? properties.lat : coordinates[1];
    const longitude = typeof properties.lon === "number" ? properties.lon : coordinates[0];
    const providerPlaceId = limitedText(properties.place_id, 240);
    const formattedAddress = limitedText(properties.formatted, 300);
    const name = limitedText(properties.name, 160)
      ?? limitedText(properties.address_line1, 160)
      ?? formattedAddress?.slice(0, 160)
      ?? null;

    if (
      !providerPlaceId || !formattedAddress || !name
      || typeof latitude !== "number" || typeof longitude !== "number"
      || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    ) return [];

    const providerCategories = categories(properties);
    const rawCountryCode = limitedText(properties.country_code, 2)?.toUpperCase() ?? null;
    return [{
      attribution: GEOAPIFY_ATTRIBUTION,
      category: categoryForGeoapify(providerCategories),
      city: limitedText(properties.city, 120)
        ?? limitedText(properties.town, 120)
        ?? limitedText(properties.village, 120),
      countryCode: rawCountryCode && /^[A-Z]{2}$/.test(rawCountryCode) ? rawCountryCode : null,
      formattedAddress,
      latitude,
      longitude,
      name,
      provider: "geoapify" as const,
      providerCategories,
      providerPlaceId,
    }];
  });
}

export function normalizeGeoapifyReverseResponse(payload: unknown): string | null {
  const root = record(payload);
  const candidates = Array.isArray(root?.results)
    ? root.results
    : Array.isArray(root?.features)
      ? root.features
      : [];
  const properties = candidateProperties(candidates[0]);
  return limitedText(properties?.formatted, 300);
}

export async function reverseGeocodeGeoapify({
  apiKey,
  fetcher = fetch,
  latitude,
  longitude,
  timeoutMs = 6_000,
}: ReverseOptions): Promise<string | null> {
  const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
  url.searchParams.set("lat", latitude.toString());
  url.searchParams.set("lon", longitude.toString());
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", "cs");
  url.searchParams.set("limit", "1");
  url.searchParams.set("apiKey", apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new GeoapifySearchError("provider", response.status);
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new GeoapifySearchError("provider");
    }
    return normalizeGeoapifyReverseResponse(payload);
  } catch (error) {
    if (error instanceof GeoapifySearchError) throw error;
    if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      throw new GeoapifySearchError("timeout");
    }
    throw new GeoapifySearchError("provider");
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchGeoapifyPlaces({
  apiKey,
  countryCodes = [],
  fetcher = fetch,
  query,
  timeoutMs = 6_000,
}: SearchOptions): Promise<PlaceSearchResult[]> {
  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", query);
  url.searchParams.set("format", "geojson");
  url.searchParams.set("lang", "cs");
  url.searchParams.set("limit", "6");
  url.searchParams.set("apiKey", apiKey);
  const countries = [...new Set(countryCodes.map((code) => code.trim().toLowerCase()).filter((code) => /^[a-z]{2}$/.test(code)))];
  if (countries.length) url.searchParams.set("filter", `countrycode:${countries.join(",")}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      cache: "no-store",
      headers: { Accept: "application/geo+json, application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new GeoapifySearchError("provider", response.status);
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new GeoapifySearchError("provider");
    }
    return normalizeGeoapifyResponse(payload);
  } catch (error) {
    if (error instanceof GeoapifySearchError) throw error;
    if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      throw new GeoapifySearchError("timeout");
    }
    throw new GeoapifySearchError("provider");
  } finally {
    clearTimeout(timeout);
  }
}
