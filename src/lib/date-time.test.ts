import { describe, expect, it } from "vitest";
import { formatDateOnly, formatDateOnlyLong, formatTripDateTime, formatTripTime } from "./date-time";

describe("date-time formatters", () => {
  it("formats date-only values without changing the calendar day", () => {
    expect(formatDateOnly("2026-08-14")).toBe("14. 8. 2026");
    expect(formatDateOnlyLong("2026-08-14")).toContain("14. srpna 2026");
  });

  it.each([
    ["Europe/Prague", "14:00"],
    ["Asia/Seoul", "22:00"],
    ["America/New_York", "08:00"],
  ])("formats an instant in %s", (timeZone, expected) => {
    expect(formatTripTime("2026-01-15T13:00:00Z", timeZone)).toBe(expected);
  });

  it("respects DST for Prague", () => {
    expect(formatTripDateTime("2026-07-01T12:00:00Z", "Europe/Prague")).toContain("14:00");
  });
});
