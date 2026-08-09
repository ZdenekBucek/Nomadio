import { describe, expect, it } from "vitest";
import { parseBudgetPlanItem } from "./budget-plan-input";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("category", "accommodation");
  data.set("plannedAmount", "30000");
  data.set("currency", "czk");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

describe("budget plan input", () => {
  it("accepts category and zero amount and supplies a default name", () => {
    expect(parseBudgetPlanItem(form({ plannedAmount: "0" }))).toEqual({
      data: {
        category: "accommodation",
        currency: "CZK",
        name: "Ubytování",
        notes: null,
        plannedAmount: 0,
        subcategory: null,
      },
      success: true,
    });
  });

  it("accepts optional name, notes and a valid subcategory", () => {
    expect(parseBudgetPlanItem(form({ name: "Hotely", notes: "Včetně snídaní", subcategory: "hotel" }))).toMatchObject({
      data: { name: "Hotely", notes: "Včetně snídaní", subcategory: "hotel" },
      success: true,
    });
  });

  it("rejects invalid amount, category, currency and category pair", () => {
    expect(parseBudgetPlanItem(form({ plannedAmount: "-1" })).success).toBe(false);
    expect(parseBudgetPlanItem(form({ category: "invalid" })).success).toBe(false);
    expect(parseBudgetPlanItem(form({ currency: "EU" })).success).toBe(false);
    expect(parseBudgetPlanItem(form({ subcategory: "flights" })).success).toBe(false);
  });
});
