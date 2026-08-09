import { describe, expect, it } from "vitest";

import { isValidTimeZone, searchTimezones, timezoneCatalog } from "./timezone-catalog";

describe("timezone catalog", () => {
  it("contains a broad canonical IANA catalog and key travel zones", () => {
    expect(timezoneCatalog.length).toBeGreaterThan(400);
    for (const id of ["Europe/Prague", "Asia/Seoul", "Asia/Tokyo", "America/New_York"]) {
      expect(timezoneCatalog.some((option) => option.id === id)).toBe(true);
    }
  });

  it.each(["Prague", "Praha", "Europe/Prague", "Seoul", "Soul", "Korea", "Tokyo", "Tokio", "New York"])(
    "finds %s",
    (query) => {
      expect(searchTimezones(query).length).toBeGreaterThan(0);
    },
  );

  it("validates runtime-supported IANA identifiers and rejects malformed values", () => {
    expect(isValidTimeZone("Asia/Seoul")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Europe/Praguuu")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("keeps valid legacy identifiers usable even outside the display catalog", () => {
    expect(isValidTimeZone("US/Eastern")).toBe(true);
  });
});
