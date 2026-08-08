import { describe, expect, it } from "vitest";
import type { AccommodationRow } from "@/lib/supabase/database.types";
import { accommodationCoverage, accommodationNights, deriveAccommodationPaymentStatus, remainingAccommodationAmount, sortAccommodations } from "./accommodation-model";

function item(id: string, checkIn: string, checkOut: string, name = id) {
  return { id, check_in_date: checkIn, check_out_date: checkOut, name, place: null } as unknown as AccommodationRow & { place: null };
}

describe("accommodation model", () => {
  it("counts nights without timezone drift", () => {
    expect(accommodationNights("2027-06-01", "2027-06-04")).toBe(3);
  });

  it("sorts chronologically and deterministically", () => {
    const sorted = sortAccommodations([item("b", "2027-06-03", "2027-06-05"), item("a", "2027-06-01", "2027-06-02")]);
    expect(sorted.map((value) => value.id)).toEqual(["a", "b"]);
  });

  it("detects gaps within trip dates", () => {
    expect(accommodationCoverage([item("a", "2027-06-01", "2027-06-03"), item("b", "2027-06-04", "2027-06-06")], "2027-06-01", "2027-06-06")).toEqual({ gapNights: 1, overlapCount: 0 });
  });

  it("clips coverage to trip dates and detects overlaps", () => {
    expect(accommodationCoverage([item("a", "2027-05-30", "2027-06-04"), item("b", "2027-06-03", "2027-06-08")], "2027-06-01", "2027-06-06")).toEqual({ gapNights: 0, overlapCount: 1 });
  });

  it("calculates remaining amount without storing it", () => {
    expect(remainingAccommodationAmount(18_500, 5_000)).toBe(13_500);
    expect(remainingAccommodationAmount(18_500, 18_500)).toBe(0);
    expect(remainingAccommodationAmount(18_500, null)).toBeNull();
    expect(remainingAccommodationAmount(100, 101)).toBeNull();
  });

  it("derives payment status from total and paid amounts", () => {
    expect(deriveAccommodationPaymentStatus(18_500, 0, "unknown")).toBe("unpaid");
    expect(deriveAccommodationPaymentStatus(18_500, 5_000, "unpaid")).toBe("partially_paid");
    expect(deriveAccommodationPaymentStatus(18_500, 18_500, "partially_paid")).toBe("paid");
  });

  it("never overwrites an explicit pay-on-site state", () => {
    expect(deriveAccommodationPaymentStatus(18_500, 5_000, "pay_on_site")).toBe("pay_on_site");
  });
});
