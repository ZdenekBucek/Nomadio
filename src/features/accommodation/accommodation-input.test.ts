import { describe, expect, it } from "vitest";
import { parseAccommodation } from "./accommodation-input";

function validData() {
  const form = new FormData();
  form.set("name", "Hotel Nord");
  form.set("accommodationType", "hotel");
  form.set("checkInDate", "2027-06-01");
  form.set("checkOutDate", "2027-06-04");
  form.set("paymentStatus", "partially_paid");
  return form;
}

describe("parseAccommodation", () => {
  it("normalizes optional values and uppercase currency", () => {
    const form = validData();
    form.set("guestCount", "2");
    form.set("totalPrice", "1200,50");
    form.set("paidAmount", "200,25");
    form.set("balanceDueDate", "2027-05-15");
    form.set("currency", "nok");
    form.set("breakfastIncluded", "yes");
    const result = parseAccommodation(form);
    expect(result).toEqual(expect.objectContaining({ success: true }));
    if (result.success) expect(result.data).toEqual(expect.objectContaining({ balanceDueDate: "2027-05-15", breakfastIncluded: true, currency: "NOK", guestCount: 2, paidAmount: 200.25, totalPrice: 1200.5 }));
  });

  it.each([
    ["unpaid", "0", "1000"],
    ["partially_paid", "400", "1000"],
    ["paid", "1000", "1000"],
  ])("accepts a consistent %s payment", (status, paid, total) => {
    const form = validData();
    form.set("paymentStatus", status);
    form.set("paidAmount", paid);
    form.set("totalPrice", total);
    expect(parseAccommodation(form).success).toBe(true);
  });

  it("accepts pay on site without a due date", () => {
    const form = validData();
    form.set("paymentStatus", "pay_on_site");
    form.set("totalPrice", "1000");
    form.set("paidAmount", "0");
    expect(parseAccommodation(form)).toEqual(expect.objectContaining({ success: true }));
  });

  it.each([
    ["name", ""],
    ["checkOutDate", "2027-06-01"],
    ["checkOutDate", "2027-05-31"],
    ["guestCount", "0"],
    ["totalPrice", "-1"],
    ["paidAmount", "-1"],
    ["currency", "EU"],
    ["bookingUrl", "javascript:alert(1)"],
  ])("rejects invalid %s", (key, value) => {
    const form = validData();
    form.set(key, value);
    expect(parseAccommodation(form).success).toBe(false);
  });

  it("rejects paid amount above total price", () => {
    const form = validData();
    form.set("totalPrice", "1000");
    form.set("paidAmount", "1001");
    expect(parseAccommodation(form).success).toBe(false);
  });

  it.each([
    ["checkInDate", "2026-02-31"],
    ["checkOutDate", "2026-02-31"],
    ["balanceDueDate", "2026-02-31"],
    ["checkInTime", "25:00"],
    ["checkOutTime", "15:61"],
  ])("rejects an invalid calendar or time value for %s", (key, value) => {
    const form = validData();
    form.set(key, value);
    expect(parseAccommodation(form).success).toBe(false);
  });

  it.each([
    ["unpaid", "1", "1000"],
    ["partially_paid", "1000", "1000"],
    ["paid", "999", "1000"],
  ])("rejects inconsistent %s amounts", (status, paid, total) => {
    const form = validData();
    form.set("paymentStatus", status);
    form.set("paidAmount", paid);
    form.set("totalPrice", total);
    expect(parseAccommodation(form).success).toBe(false);
  });
});
