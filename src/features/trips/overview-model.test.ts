import { describe, expect, it } from "vitest";
import { buildTripOverview } from "./overview-model";

describe("buildTripOverview", () => {
  it("keeps currencies separate and prioritizes an overdue payment", () => {
    const view = buildTripOverview({ accommodations: [], budget: [{ balanceDueDate: "2020-01-01", currency: "CZK", href: "/budget", id: "late", name: "Hotel", remainingAmount: 1200 }, { balanceDueDate: "2099-01-01", currency: "EUR", href: "/budget", id: "future", name: "Train", remainingAmount: 12 }] as never, documents: [], itineraryDays: [], itineraryItems: [], packingItems: [], tasks: [], transport: [], tripEnd: "2026-08-15", tripId: "trip", tripStart: "2026-08-14" });
    expect(view.currencies.map((item) => item.currency)).toEqual(["CZK", "EUR"]); expect(view.nearestPayment?.id).toBe("late"); expect(view.alerts[0]?.id).toBe("payment:late");
  });
  it("does not count an undated itinerary template as a planned trip day", () => {
    const view = buildTripOverview({ accommodations: [], budget: [], documents: [], itineraryDays: [{ day_date: null, id: "template" }, { day_date: "2026-08-14", id: "day" }] as never, itineraryItems: [{ day_id: "template" }, { day_id: "day" }] as never, packingItems: [], tasks: [], transport: [], tripEnd: "2026-08-15", tripId: "trip", tripStart: "2026-08-14" });
    expect(view.itinerary).toMatchObject({ plannedDays: 1, totalDays: 1 });
  });
});
