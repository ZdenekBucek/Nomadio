import { describe, expect, it } from "vitest";
import { parseBudgetItem } from "./budget-input";

function form() {
  const data = new FormData();
  data.set("name", "Vstup do muzea"); data.set("category", "activities"); data.set("estimatedAmount", "1200,50");
  data.set("actualAmount", "1000"); data.set("paidAmount", "250"); data.set("currency", "nok");
  data.set("balanceDueDate", "2027-05-15"); data.set("paymentStatus", "unknown"); data.set("notes", "Online");
  data.set("subcategory", "entrance_fees");
  return data;
}

describe("budget item input", () => {
  it("normalizes amounts, currency, due date and derived status", () => {
    const result = parseBudgetItem(form());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ actualAmount: 1000, balanceDueDate: "2027-05-15", category: "activities", currency: "NOK", estimatedAmount: 1200.5, name: "Vstup do muzea", notes: "Online", paidAmount: 250, paymentStatus: "partially_paid", subcategory: "entrance_fees" });
  });

  it("allows an estimate without actual amount and pay on site without due date", () => {
    const data = form(); data.delete("actualAmount"); data.delete("balanceDueDate"); data.set("paidAmount", "0"); data.set("paymentStatus", "pay_on_site");
    const result = parseBudgetItem(data);
    expect(result.success && result.data.paymentStatus).toBe("pay_on_site");
  });

  it.each([
    ["missing name", "name", ""],
    ["unknown category", "category", "hotel"],
    ["negative amount", "actualAmount", "-1"],
    ["too many decimals", "paidAmount", "1.234"],
    ["invalid currency", "currency", "EU"],
    ["invalid due date", "balanceDueDate", "15.5.2027"],
  ])("rejects %s", (_label, key, value) => {
    const data = form(); data.set(key, value);
    expect(parseBudgetItem(data).success).toBe(false);
  });

  it("rejects paid amount above the actual or estimated base", () => {
    const data = form(); data.set("actualAmount", "100"); data.set("paidAmount", "101");
    expect(parseBudgetItem(data).success).toBe(false);
  });

  it("allows no subcategory and rejects a subcategory from another category", () => {
    const without = form(); without.delete("subcategory");
    expect(parseBudgetItem(without).success).toBe(true);
    const invalid = form(); invalid.set("subcategory", "fuel");
    expect(parseBudgetItem(invalid).success).toBe(false);
  });
});
