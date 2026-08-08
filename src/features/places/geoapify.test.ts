import { describe, expect, it, vi } from "vitest";
import { GeoapifySearchError, normalizeGeoapifyResponse, normalizeGeoapifyReverseResponse, reverseGeocodeGeoapify, searchGeoapifyPlaces } from "./geoapify";

const payload = {
  features: [{
    geometry: { coordinates: [14.4378, 50.0755], type: "Point" },
    properties: {
      address_line1: "Hotel Praha",
      categories: ["accommodation.hotel"],
      city: "Praha",
      country_code: "cz",
      formatted: "Hotel Praha, Václavské náměstí, Praha, Česko",
      name: "Hotel Praha",
      place_id: "geo-place-1",
    },
    type: "Feature",
  }],
  type: "FeatureCollection",
};
const feature = payload.features[0]!;

describe("Geoapify place adapter", () => {
  it("normalizes a reverse-geocoded address", () => {
    expect(normalizeGeoapifyReverseResponse({ results: [{ formatted:"Karlův most, Praha, Česko" }] })).toBe("Karlův most, Praha, Česko");
    expect(normalizeGeoapifyReverseResponse({ results: [] })).toBeNull();
  });

  it("calls reverse geocoding in Czech with one result", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok:true, json:async()=>({results:[{formatted:"Praha"}]}) });
    await expect(reverseGeocodeGeoapify({apiKey:"not-a-secret",fetcher,latitude:50,longitude:14})).resolves.toBe("Praha");
    const url=fetcher.mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe("/v1/geocode/reverse");
    expect(url.searchParams.get("lang")).toBe("cs");
    expect(url.searchParams.get("limit")).toBe("1");
  });
  it("normalizes a provider-neutral result", () => {
    expect(normalizeGeoapifyResponse(payload)).toEqual([expect.objectContaining({
      category: "accommodation",
      city: "Praha",
      countryCode: "CZ",
      formattedAddress: "Hotel Praha, Václavské náměstí, Praha, Česko",
      latitude: 50.0755,
      longitude: 14.4378,
      name: "Hotel Praha",
      provider: "geoapify",
      providerCategories: ["accommodation.hotel"],
      providerPlaceId: "geo-place-1",
    })]);
  });

  it.each([
    [{ ...feature, properties: { ...feature.properties, place_id: undefined } }],
    [{ ...feature, properties: { ...feature.properties, formatted: undefined } }],
    [{ ...feature, geometry: { coordinates: [181, 50], type: "Point" } }],
    [{ ...feature, geometry: { coordinates: [14, 91], type: "Point" } }],
  ])("rejects incomplete or invalid results", (feature) => {
    expect(normalizeGeoapifyResponse({ features: [feature] })).toEqual([]);
  });

  it("uses Czech, a bounded result count, and trip countries", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    await searchGeoapifyPlaces({ apiKey: "not-a-secret", countryCodes: ["CZ", "cz", "DE"], fetcher, query: "Hotel Praha" });
    const url = fetcher.mock.calls[0]?.[0] as URL;
    expect(url.searchParams.get("lang")).toBe("cs");
    expect(url.searchParams.get("limit")).toBe("6");
    expect(url.searchParams.get("filter")).toBe("countrycode:cz,de");
  });

  it("returns a safe error for invalid provider JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError(); } });
    await expect(searchGeoapifyPlaces({ apiKey: "not-a-secret", fetcher, query: "Praha" })).rejects.toEqual(new GeoapifySearchError("provider"));
  });

  it("aborts a timed-out request", async () => {
    const fetcher = vi.fn((_url: URL, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as unknown as typeof fetch;
    await expect(searchGeoapifyPlaces({ apiKey: "not-a-secret", fetcher, query: "Praha", timeoutMs: 1 })).rejects.toEqual(new GeoapifySearchError("timeout"));
  });

  it("normalizes provider failures without exposing response bodies", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(searchGeoapifyPlaces({ apiKey: "not-a-secret", fetcher, query: "Praha" })).rejects.toEqual(new GeoapifySearchError("provider", 500));
  });
});
