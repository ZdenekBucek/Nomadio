import { describe, expect, it } from "vitest";
import {
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
});
