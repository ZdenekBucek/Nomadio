import { describe, expect, it } from "vitest";
import { parseDayPlaceDetails } from "./day-place-input";

describe("parseDayPlaceDetails", () => {
  it("normalizes optional day details", () => {
    const form = new FormData();
    form.set("startTime", "09:15");
    form.set("endTime", " 10:30 ");
    form.set("notes", " Rezervace u okna ");
    expect(parseDayPlaceDetails(form)).toEqual({
      data: { startTime: "09:15", endTime: "10:30", notes: "Rezervace u okna" },
      success: true,
    });
  });

  it("accepts empty optional values", () => {
    expect(parseDayPlaceDetails(new FormData())).toEqual({
      data: { startTime: null, endTime: null, notes: null },
      success: true,
    });
  });

  it("rejects invalid times and overly long notes", () => {
    const invalidTime = new FormData();
    invalidTime.set("startTime", "25:00");
    expect(parseDayPlaceDetails(invalidTime)).toEqual({ success: false });
    const longNotes = new FormData();
    longNotes.set("notes", "x".repeat(1201));
    expect(parseDayPlaceDetails(longNotes)).toEqual({ success: false });
  });
});
