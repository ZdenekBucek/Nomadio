import { describe, expect, it } from "vitest";
import { parseMapboxPlace } from "./mapbox-place-input";

function valid() {
  const data = new FormData();
  Object.entries({
    address: "Saltstraumen 33",
    category: "custom",
    city: "Bodø",
    countryCode: "no",
    latitude: "67.2301",
    longitude: "14.6171",
    name: "Saltstraumen 33",
    providerCategory: "address",
    providerPlaceId: "dXJuOm1ieGFkcjo1",
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("parseMapboxPlace", () => {
  it("accepts and normalizes a provider result", () => {
    const result = parseMapboxPlace(valid());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.countryCode).toBe("NO");
  });

  it("accepts the charging category", () => {
    const data = valid();
    data.set("category", "charging");
    const result = parseMapboxPlace(data);
    expect(result).toMatchObject({ success: true, data: { category: "charging" } });
  });

  it("rejects invalid coordinates", () => {
    const data = valid();
    data.set("latitude", "91");
    expect(parseMapboxPlace(data).success).toBe(false);
  });

  it("rejects missing provider identity", () => {
    const data = valid();
    data.set("providerPlaceId", "");
    expect(parseMapboxPlace(data).success).toBe(false);
  });
});
