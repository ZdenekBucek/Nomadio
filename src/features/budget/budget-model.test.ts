import { describe, expect, it } from "vitest";
import type { AccommodationRow, BudgetItemRow, TransportBookingRow } from "@/lib/supabase/database.types";
import {
  deriveBudgetPaymentStatus,
  normalizeAccommodationBudgetRow,
  normalizeManualBudgetRow,
  normalizeTransportBudgetRow,
  pendingBudgetPayments,
  remainingBudgetAmount,
  summarizeBudgetByCategory,
  summarizeBudgetByCurrency,
  summarizeBudgetBySubcategory,
} from "./budget-model";

const base = {
  balance_due_date: "2027-05-15", created_at: "", created_by: "user", currency: "NOK", id: "source", notes: null,
  paid_amount: 250, payment_status: "partially_paid" as const, total_price: 1000, trip_id: "trip", updated_at: "",
};

describe("budget model", () => {
  it("normalizes accommodation and transport without copying their data", () => {
    const accommodation = normalizeAccommodationBudgetRow({ ...base, accommodation_type: "hotel", booking_reference: null, booking_url: null, breakfast_included: null, check_in_date: "2027-06-01", check_in_time: null, check_out_date: "2027-06-02", check_out_time: null, guest_count: null, name: "Hotel", place_id: null, room_type: null } as AccommodationRow, "CZK");
    const transport = normalizeTransportBudgetRow({ ...base, booking_reference: null, provider: null, status: "booked", title: "Let", transport_type: "flight" } as TransportBookingRow, "CZK");
    expect(accommodation).toMatchObject({ actualAmount: 1000, category: "accommodation", editable: false, remainingAmount: 750, sourceType: "accommodation", subcategory: "hotel" });
    expect(transport).toMatchObject({ actualAmount: 1000, category: "transport", editable: false, remainingAmount: 750, sourceType: "transport", subcategory: "flights" });
  });

  it("uses actual over estimate and otherwise derives remaining from estimate", () => {
    expect(remainingBudgetAmount(900, 1000, 200, "partially_paid")).toBe(700);
    expect(remainingBudgetAmount(null, 1000, 200, "partially_paid")).toBe(800);
    expect(remainingBudgetAmount(null, null, 0, "unpaid")).toBeNull();
  });

  it("normalizes a manual item and derives its payment status without overriding pay on site", () => {
    const item = normalizeManualBudgetRow({ actual_amount: null, balance_due_date: null, category: "food", created_at: "", created_by: "user", currency: "CZK", estimated_amount: 500, id: "manual", name: "Jídlo", notes: null, paid_amount: 100, payment_status: "partially_paid", source_id: null, source_type: "manual", subcategory: "restaurants", trip_id: "trip", updated_at: "" } as BudgetItemRow);
    expect(item).toMatchObject({ estimatedAmount: 500, remainingAmount: 400, sourceType: "manual" });
    expect(deriveBudgetPaymentStatus(500, null, 500, "unknown")).toBe("paid");
    expect(deriveBudgetPaymentStatus(500, null, 0, "pay_on_site")).toBe("pay_on_site");
  });

  it("keeps currencies separate and summarizes categories independently", () => {
    const rows = [
      { ...normalizeManualBudgetRow({ actual_amount: 100, balance_due_date: null, category: "food", created_at: "", created_by: "", currency: "CZK", estimated_amount: null, id: "one", name: "A", notes: null, paid_amount: 20, payment_status: "partially_paid", source_id: null, source_type: "manual", subcategory: "restaurants", trip_id: "trip", updated_at: "" }), id: "one" },
      { ...normalizeManualBudgetRow({ actual_amount: 50, balance_due_date: null, category: "transport", created_at: "", created_by: "", currency: "EUR", estimated_amount: null, id: "two", name: "B", notes: null, paid_amount: 50, payment_status: "paid", source_id: null, source_type: "manual", subcategory: "train", trip_id: "trip", updated_at: "" }), id: "two" },
    ];
    expect(summarizeBudgetByCurrency(rows)).toEqual([
      { actual: 100, currency: "CZK", estimated: 0, paid: 20, remaining: 80 },
      { actual: 50, currency: "EUR", estimated: 0, paid: 50, remaining: 0 },
    ]);
    expect(summarizeBudgetByCategory(rows).find((item) => item.category === "food")?.currencies[0]?.actual).toBe(100);
    expect(summarizeBudgetBySubcategory(rows, "food")[0]).toMatchObject({ subcategory: "restaurants", currencies: [{ actual: 100 }] });
  });

  it("sorts pending payments by due date and leaves missing dates last", () => {
    const row = (id: string, due: string | null) => normalizeManualBudgetRow({ actual_amount: 100, balance_due_date: due, category: "other", created_at: "", created_by: "", currency: "CZK", estimated_amount: null, id, name: id, notes: null, paid_amount: 0, payment_status: "unpaid", source_id: null, source_type: "manual", subcategory: null, trip_id: "trip", updated_at: "" });
    expect(pendingBudgetPayments([row("none", null), row("later", "2027-06-02"), row("first", "2027-05-01")]).map((item) => item.id)).toEqual(["first", "later", "none"]);
  });
});
