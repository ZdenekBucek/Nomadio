import { describe, expect, it } from "vitest";
import { parseExpenseInput } from "./budget-expense-input";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("amount", "350,50");
  data.set("category", "food");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

describe("expense input", () => {
  it("creates the minimum quick expense with current server time and trip currency", () => {
    expect(parseExpenseInput(form(), { currency: "czk", now: new Date("2027-06-01T12:34:56Z") })).toEqual({
      data: {
        amount: 350.5,
        category: "food",
        currency: "CZK",
        notes: null,
        occurredAt: "2027-06-01T12:34:56.000Z",
        paidByTravelerId: null,
        subcategory: null,
        title: null,
      },
      success: true,
    });
  });

  it("allows changing the date and optional details", () => {
    expect(parseExpenseInput(form({ occurredDate: "2027-05-31", notes: "Večeře", subcategory: "restaurants", title: "Bistro" }), { currency: "CZK" })).toMatchObject({
      data: {
        notes: "Večeře",
        occurredAt: "2027-05-31T12:00:00.000Z",
        subcategory: "restaurants",
        title: "Bistro",
      },
      success: true,
    });
  });

  it("rejects invalid amount, category, subcategory, currency and traveler id", () => {
    expect(parseExpenseInput(form({ amount: "0" }), { currency: "CZK" }).success).toBe(false);
    expect(parseExpenseInput(form({ category: "invalid" }), { currency: "CZK" }).success).toBe(false);
    expect(parseExpenseInput(form({ subcategory: "fuel" }), { currency: "CZK" }).success).toBe(false);
    expect(parseExpenseInput(form(), { currency: "CZ" }).success).toBe(false);
    expect(parseExpenseInput(form({ paidByTravelerId: "not-a-uuid" }), { currency: "CZK" }).success).toBe(false);
  });
});
