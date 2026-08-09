import { describe, expect, it } from "vitest";
import type { BudgetPlanItemRow, ExpenseRow } from "@/lib/supabase/database.types";
import { mapBudgetPlanItemRow, mapExpenseRow, mapExpenseToReality } from "./budget-storage-model";
import { parseQuickExpense } from "./quick-expense-input";

describe("budget storage model", () => {
  it("maps a stored plan item to the Plan domain contract", () => {
    const row = {
      category: "food",
      created_at: "2027-01-01T00:00:00Z",
      created_by: "user",
      currency: "CZK",
      id: "plan",
      name: "Jídlo",
      notes: null,
      planned_amount: 10_000,
      subcategory: null,
      trip_id: "trip",
      updated_at: "2027-01-01T00:00:00Z",
    } satisfies BudgetPlanItemRow;
    expect(mapBudgetPlanItemRow(row)).toEqual({
      category: "food",
      currency: "CZK",
      id: "plan",
      name: "Jídlo",
      plannedAmount: 10_000,
      subcategory: null,
      tripId: "trip",
    });
  });

  it("maps a stored expense to editable Reality with occurredAt", () => {
    const row = {
      amount: 450,
      category: "transport",
      created_at: "2027-06-01T10:00:00Z",
      created_by: "user",
      currency: "CZK",
      id: "expense",
      notes: "Centrum",
      occurred_at: "2027-06-01T09:30:00Z",
      paid_by_traveler_id: "traveler",
      subcategory: "taxi_transfer",
      title: "Taxi",
      trip_id: "trip",
      updated_at: "2027-06-01T10:00:00Z",
    } satisfies ExpenseRow;
    const expense = mapExpenseRow(row);
    expect(expense).toMatchObject({ occurredAt: "2027-06-01T09:30:00Z", paidByTravelerId: "traveler" });
    expect(mapExpenseToReality(expense)).toMatchObject({
      amount: 450,
      editable: true,
      occurredAt: "2027-06-01T09:30:00Z",
      origin: "manual",
      sourceId: "expense",
    });
  });
});

describe("quick expense server contract", () => {
  it("fills trip, user, currency and current occurrence automatically", () => {
    const formData = new FormData();
    formData.set("amount", "350,50");
    formData.set("category", "food");
    const result = parseQuickExpense(formData, {
      createdBy: "user",
      currency: "czk",
      now: new Date("2027-06-01T12:34:56Z"),
      tripId: "trip",
    });
    expect(result).toEqual({
      data: {
        amount: 350.5,
        category: "food",
        createdBy: "user",
        currency: "CZK",
        note: null,
        occurredAt: "2027-06-01T12:34:56.000Z",
        subcategory: null,
        title: null,
        tripId: "trip",
      },
      success: true,
    });
  });

  it("rejects missing amount and a mismatched category/subcategory", () => {
    const context = { createdBy: "user", currency: "CZK", now: new Date("2027-06-01T12:00:00Z"), tripId: "trip" };
    const missing = new FormData();
    missing.set("category", "food");
    expect(parseQuickExpense(missing, context)).toEqual({ success: false });

    const mismatch = new FormData();
    mismatch.set("amount", "100");
    mismatch.set("category", "food");
    mismatch.set("subcategory", "fuel");
    expect(parseQuickExpense(mismatch, context)).toEqual({ success: false });
  });
});
