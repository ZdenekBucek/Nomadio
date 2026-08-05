import { describe, expect, it } from "vitest";
import {
  categoryForGeoapify,
  isPlaceCategory,
  placeCategories,
  placeCategoryLabels,
  placeCategoryLayerLabels,
} from "./categories";

describe("place categories", () => {
  it("keeps charging in the shared category contract", () => {
    expect(placeCategories).toContain("charging");
    expect(placeCategoryLabels.charging).toBe("Nabíjecí místo");
    expect(placeCategoryLayerLabels.charging).toBe("Nabíjení");
    expect(isPlaceCategory("charging")).toBe(true);
  });

  it("rejects categories outside the shared contract", () => {
    expect(isPlaceCategory("fuel")).toBe(false);
  });

  it.each([
    ["accommodation.hotel", "accommodation"],
    ["catering.restaurant", "food"],
    ["catering.cafe", "food"],
    ["catering.fast_food", "food"],
    ["tourism.attraction", "sight"],
    ["entertainment.museum", "sight"],
    ["heritage.unesco", "sight"],
    ["leisure.park", "nature"],
    ["natural.forest", "nature"],
    ["commercial.supermarket", "shopping"],
    ["service.vehicle.charging_station", "charging"],
    ["public_transport.train", "transport"],
    ["unknown.category", "custom"],
  ])("maps Geoapify %s to %s", (providerCategory, expected) => {
    expect(categoryForGeoapify([providerCategory])).toBe(expected);
  });
});
