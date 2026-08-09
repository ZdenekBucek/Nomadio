import { describe, expect, it } from "vitest";
import { dateOnlyToCalendarDate, formatDateOnly, formatDateOnlyLong, formatTripDateTime, formatTripTime, isValidDateOnly, isValidDateTimeLocal, isValidTimeOnly, timestampToDateTimeLocal } from "./date-time";

describe("date-time formatters", () => {
  it("formats date-only values without changing the calendar day", () => {
    expect(formatDateOnly("2026-08-14")).toBe("14. 8. 2026");
    expect(formatDateOnlyLong("2026-08-14")).toContain("14. srpna 2026");
  });

  it("validates real calendar dates, including leap years", () => {
    expect(isValidDateOnly("2028-02-29")).toBe(true);
    expect(isValidDateOnly("2027-02-29")).toBe(false);
    expect(isValidDateOnly("2026-02-31")).toBe(false);
  });

  it("creates a calendar date without shifting a date-only value", () => {
    const date = dateOnlyToCalendarDate("2026-10-14");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(14);
  });

  it("accepts only canonical 24-hour time values", () => {
    expect(isValidTimeOnly("15:00")).toBe(true);
    expect(isValidTimeOnly("5:00")).toBe(false);
    expect(isValidTimeOnly("24:00")).toBe(false);
  });

  it("validates canonical local datetimes without applying a timezone", () => {
    expect(isValidDateTimeLocal("2026-10-14T14:30")).toBe(true);
    expect(isValidDateTimeLocal("2026-02-31T14:30")).toBe(false);
    expect(isValidDateTimeLocal("2026-10-14T24:00")).toBe(false);
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

  it("returns stored instants as canonical local datetime values in the trip timezone", () => {
    expect(timestampToDateTimeLocal("2026-08-20T12:30:00Z", "Europe/Prague")).toBe("2026-08-20T14:30");
    expect(timestampToDateTimeLocal("2026-08-20T05:30:00Z", "Asia/Seoul")).toBe("2026-08-20T14:30");
    expect(timestampToDateTimeLocal("2026-08-20T18:30:00Z", "America/New_York")).toBe("2026-08-20T14:30");
  });
});
