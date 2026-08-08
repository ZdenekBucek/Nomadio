import { describe, expect, it } from "vitest";
import type { TransportBookingWithSegments } from "./transport-model";
import { dateTimeInputValue, deriveTransportPaymentStatus, remainingTransportAmount, sortTransportBookings, transportSummary } from "./transport-model";

function booking(overrides: Partial<TransportBookingWithSegments> = {}): TransportBookingWithSegments {
  return {
    balance_due_date: null, booking_reference: null, created_at: "2027-01-01T00:00:00Z", created_by: "user", currency: "NOK", id: "booking", notes: null,
    paid_amount: 0, payment_status: "unpaid", provider: null, segments: [], status: "planned", title: "Přesun", total_price: 1000, transport_type: "train", trip_id: "trip", updated_at: "2027-01-01T00:00:00Z", ...overrides,
  };
}

function segment(id: string, departure: string | null) {
  return { arrival_at: null, arrival_place_id: null, arrivalPlace: null, baggage: null, booking_id: "booking", created_at: "", departure_at: departure, departure_place_id: null, departurePlace: null, id, notes: null, platform: null, seat: null, service_number: null, sort_order: 0, terminal: null, updated_at: "" };
}

describe("transport model", () => {
  it("computes remaining amount and preserves explicit pay on site", () => {
    expect(remainingTransportAmount(9800, 2000)).toBe(7800);
    expect(remainingTransportAmount(100, 101)).toBeNull();
    expect(deriveTransportPaymentStatus(9800, 2000, "unknown")).toBe("partially_paid");
    expect(deriveTransportPaymentStatus(9800, 0, "pay_on_site")).toBe("pay_on_site");
    expect(deriveTransportPaymentStatus(9800, 9800, "unpaid")).toBe("paid");
  });

  it("sorts bookings chronologically and puts undated bookings last", () => {
    const later = booking({ id: "later", segments: [segment("2", "2027-06-03T08:00:00Z")] });
    const undated = booking({ id: "undated", segments: [segment("3", null)] });
    const earlier = booking({ id: "earlier", segments: [segment("1", "2027-06-02T08:00:00Z")] });
    expect(sortTransportBookings([later, undated, earlier]).map((item) => item.id)).toEqual(["earlier", "later", "undated"]);
  });

  it("summarizes bookings, segments, pending payments and nearest movement", () => {
    const items = [
      booking({ id: "one", payment_status: "partially_paid", segments: [segment("1", "2027-06-02T08:00:00Z"), segment("2", "2027-06-02T10:00:00Z")] }),
      booking({ id: "two", payment_status: "paid", segments: [segment("3", "2027-06-04T08:00:00Z")] }),
    ];
    expect(transportSummary(items, new Date("2027-06-01T00:00:00Z"))).toEqual({ bookings: 2, nearestMovement: "2027-06-02T08:00:00Z", pendingPayments: 1, segments: 3 });
  });

  it("formats stored timestamps in the trip timezone for datetime-local inputs", () => {
    expect(dateTimeInputValue("2027-06-02T06:00:00Z", "Europe/Oslo")).toBe("2027-06-02T08:00");
  });
});
