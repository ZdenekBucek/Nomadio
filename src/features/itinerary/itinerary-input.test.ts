import { describe, expect, it } from "vitest";
import { parseItineraryDay } from "./itinerary-input";

function data(values: Record<string, string>) { const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.set(key, value)); return form; }

describe("parseItineraryDay", () => {
  it("normalizes a dated reserve plan", () => expect(parseItineraryDay(data({ name: "  Přílet  ", city: "  Tokio ", date: "2027-05-01", status: "confirmed", isReserve: "on" }))).toEqual({ success: true, data: { name: "Přílet", city: "Tokio", date: "2027-05-01", status: "confirmed", isReserve: true } }));
  it("accepts a whole plan without date", () => expect(parseItineraryDay(data({ name: "Deštivý den", status: "plan" }))).toMatchObject({ success: true, data: { date: null, city: null } }));
  it.each([{ name: "", status: "plan" }, { name: "Den", status: "bad" }, { name: "Den", status: "plan", date: "2027-02-31" }])("rejects invalid values", (values) => expect(parseItineraryDay(data(values))).toEqual({ success: false, error: "invalid" }));
});
