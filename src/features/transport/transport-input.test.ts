import { describe, expect, it } from "vitest";
import { parseTransportBooking } from "./transport-input";

const placeId = "11111111-1111-4111-8111-111111111111";
function validForm() {
  const form = new FormData();
  form.set("title", "Let Praha – Oslo"); form.set("transportType", "flight"); form.set("status", "booked");
  form.set("totalPrice", "9800"); form.set("paidAmount", "2000"); form.set("currency", "nok"); form.set("paymentStatus", "partially_paid"); form.set("balanceDueDate", "2027-05-15");
  form.set("segments", JSON.stringify([{ departurePlace: { mode: "saved", placeId }, arrivalPlace: { mode: "none" }, departureAt: "2027-06-02T08:00", arrivalAt: "2027-06-02T10:00", serviceNumber: "DY123", terminal: "2", platform: "", seat: "12A", baggage: "1× 23 kg", notes: "" }]));
  return form;
}

describe("transport booking input", () => {
  it("parses a multi-field segment and normalizes currency", () => {
    const result = parseTransportBooking(validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("NOK");
      expect(result.data.segments[0]?.departurePlace).toEqual({ mode: "saved", placeId });
      expect(result.data.totalPrice! - result.data.paidAmount!).toBe(7800);
    }
  });

  it("accepts multiple segments and keeps their submitted order", () => {
    const form = validForm();
    const segments = JSON.parse(form.get("segments")!.toString());
    form.set("segments", JSON.stringify([...segments, { ...segments[0], serviceNumber: "F4", departureAt: "2027-06-02T10:30", arrivalAt: "2027-06-02T15:00" }]));
    const result = parseTransportBooking(form);
    expect(result.success && result.data.segments.map((item) => item.serviceNumber)).toEqual(["DY123", "F4"]);
  });

  it.each([
    ["negative total", "totalPrice", "-1"],
    ["paid above total", "paidAmount", "9801"],
    ["invalid currency", "currency", "NO"],
  ])("rejects %s", (_label, key, value) => {
    const form = validForm(); form.set(key, value);
    expect(parseTransportBooking(form).success).toBe(false);
  });

  it("rejects arrival before departure and missing segments", () => {
    const form = validForm();
    const segments = JSON.parse(form.get("segments")!.toString());
    segments[0].arrivalAt = "2027-06-02T07:00";
    form.set("segments", JSON.stringify(segments));
    expect(parseTransportBooking(form).success).toBe(false);
    form.set("segments", "[]");
    expect(parseTransportBooking(form).success).toBe(false);
  });

  it("rejects impossible calendar dates before the RPC conversion boundary", () => {
    const form = validForm();
    const segments = JSON.parse(form.get("segments")!.toString());
    segments[0].departureAt = "2026-02-31T14:30";
    form.set("segments", JSON.stringify(segments));
    expect(parseTransportBooking(form).success).toBe(false);
  });

  it("accepts a complete provider-neutral Geoapify place selection", () => {
    const form = validForm();
    const external = { category: "transport", mode: "external", result: { provider: "geoapify", providerPlaceId: "poi-1", name: "Oslo lufthavn", formattedAddress: "Edvard Munchs veg, Gardermoen", city: "Gardermoen", countryCode: "NO", latitude: 60.1939, longitude: 11.1004, providerCategories: ["public_transport.air"], category: "transport", attribution: "Powered by Geoapify · © OpenStreetMap contributors" } };
    const segments = JSON.parse(form.get("segments")!.toString()); segments[0].arrivalPlace = external;
    form.set("segments", JSON.stringify(segments));
    expect(parseTransportBooking(form).success).toBe(true);
  });
});
