import { describe, expect, it } from "vitest";
import {
  accommodationBudgetClassification,
  budgetCategories,
  budgetCategoryLabels,
  budgetSubcategoryCatalog,
  budgetSubcategoriesFor,
  isSubcategoryForCategory,
  transportBudgetClassification,
} from "./budget-categories";

describe("budget category catalog", () => {
  it("provides a Czech label for every stable main category", () => {
    expect(budgetCategories).toHaveLength(10);
    for (const category of budgetCategories) expect(budgetCategoryLabels[category]).toBeTruthy();
  });

  it("assigns every unique subcategory to exactly one main category", () => {
    expect(new Set(budgetSubcategoryCatalog.map((item) => item.value)).size).toBe(budgetSubcategoryCatalog.length);
    for (const item of budgetSubcategoryCatalog) {
      expect(isSubcategoryForCategory(item.category, item.value)).toBe(true);
      expect(budgetSubcategoriesFor(item.category)).toContainEqual(item);
    }
  });

  it("maps accommodation types to accommodation subcategories", () => {
    expect(accommodationBudgetClassification("hotel")).toEqual({ category: "accommodation", subcategory: "hotel" });
    expect(accommodationBudgetClassification("friends_family")).toEqual({ category: "accommodation", subcategory: "other_accommodation" });
  });

  it("maps transport and car types to their reporting hierarchy", () => {
    expect(transportBudgetClassification("flight")).toEqual({ category: "transport", subcategory: "flights" });
    expect(transportBudgetClassification("rental_car")).toEqual({ category: "car", subcategory: "rental_car" });
    expect(transportBudgetClassification("private_car")).toEqual({ category: "car", subcategory: "car_other" });
  });
});
