import { describe, expect, it, vi } from "vitest";
import { MapboxSearchError, normalizeMapboxResponse, searchMapboxPlaces } from "./mapbox";

const payload = {
  features: [{
    geometry: { coordinates: [14.6171, 67.2301], type: "Point" },
    properties: {
      context: { country: { country_code: "no", name: "Norsko" }, place: { name: "Bodø" } },
      feature_type: "address",
      full_address: "Saltstraumen 33, 8056 Saltstraumen, Norsko",
      mapbox_id: "dXJuOm1ieGFkcjo1",
      name: "Saltstraumen 33",
    },
    type: "Feature",
  }],
  type: "FeatureCollection",
};

describe("Mapbox place adapter", () => {
  it("normalizes a Geocoding v6 feature", () => {
    expect(normalizeMapboxResponse(payload)).toEqual([{
      attribution: "© Mapbox",
      category: "custom",
      city: "Bodø",
      countryCode: "NO",
      formattedAddress: "Saltstraumen 33, 8056 Saltstraumen, Norsko",
      latitude: 67.2301,
      longitude: 14.6171,
      name: "Saltstraumen 33",
      provider: "mapbox",
      providerCategories: ["address"],
      providerPlaceId: "dXJuOm1ieGFkcjo1",
    }]);
  });

  it("drops malformed features", () => {
    expect(normalizeMapboxResponse({ features: [{ properties: { name: "Bez souřadnic" } }] })).toEqual([]);
  });

  it("maps an EV charging provider category", () => {
    const result = normalizeMapboxResponse({
      features: [{
        geometry: { coordinates: [14.4, 50.1], type: "Point" },
        properties: {
          feature_type: "poi",
          mapbox_id: "charging-station",
          name: "Rychlonabíječka",
          poi_category_ids: ["ev_charging_station"],
        },
      }],
    });

    expect(result[0]?.category).toBe("charging");
  });

  it("requests permanent results limited by trip countries", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    await searchMapboxPlaces({ accessToken: "test-token", countryCodes: ["NO", "no", "SE"], fetcher, query: "Saltstraumen" });
    const call = fetcher.mock.calls[0];
    expect(call).toBeDefined();
    const url = call?.[0] as URL;
    expect(url.searchParams.get("permanent")).toBe("true");
    expect(url.searchParams.get("country")).toBe("no,se");
    expect(url.searchParams.get("access_token")).toBe("test-token");
  });

  it("returns a safe provider error", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    await expect(searchMapboxPlaces({ accessToken: "test-token", fetcher, query: "Bodø" })).rejects.toEqual(new MapboxSearchError(429));
  });
});
