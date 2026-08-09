import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TripOverviewDashboard } from "./trip-overview-dashboard";

afterEach(cleanup);

describe("TripOverviewDashboard finance", () => {
  it("labels remaining budget separately from remaining payment", () => {
    render(<TripOverviewDashboard data={{
      accommodation: { nights: 0, reservations: 0 },
      alerts: [],
      coverage: { gapNights: 0, overlapCount: 0 },
      dayItems: [],
      document: { important: 0, offline: 0, total: 0 },
      finance: [{ currency: "CZK", paidAmount: 200, planAmount: 1000, realityAmount: 700, remainingBudget: 300, remainingPayment: 500 }],
      itinerary: { items: 0, plannedDays: 0, totalDays: 0 },
      nearestPayment: null,
      nearestTransport: null,
      openTasks: [],
      packing: { packed: 0, remaining: 0, total: 0 },
      selectedDay: null,
      task: { completed: 0, remaining: 0, total: 0 },
      upcomingAccommodation: null,
    } as never} tripId="trip" />);

    expect(screen.getByText("Realita").closest("p")).toHaveTextContent("Realita 700 Kč · plán 1 000 Kč");
    expect(screen.getByText(/Zbývá z plánu/)).toHaveTextContent("Zbývá z plánu 300 Kč");
    expect(screen.getByText(/Zaplaceno/)).toHaveTextContent("Zaplaceno 200 Kč · zbývá zaplatit 500 Kč");
  });

  it("prioritizes overdue payment hierarchy and keeps the future label otherwise", () => {
    const base = {
      accommodation: { nights: 0, reservations: 0 }, alerts: [], coverage: { gapNights: 0, overlapCount: 0 }, dayItems: [], document: { important: 0, offline: 0, total: 0 }, finance: [], itinerary: { items: 0, plannedDays: 0, totalDays: 0 }, nearestTransport: null, openTasks: [], packing: { packed: 0, remaining: 0, total: 0 }, selectedDay: null, task: { completed: 0, remaining: 0, total: 0 }, timezone: "Europe/Prague", upcomingAccommodation: null,
    };
    const { rerender } = render(<TripOverviewDashboard data={{ ...base, nearestPayment: { currency: "CZK", dueDate: "2026-08-08", id: "payment", remainingAmount: 1930, sourceId: "stay", sourceType: "accommodation", title: "Doplatek hotelu", tripId: "trip" }, nearestPaymentOverdue: true } as never} tripId="trip" />);
    expect(screen.getByRole("heading", { name: "Po splatnosti" })).toBeInTheDocument();
    expect(screen.getByText(/splatnost 8\. 8\. 2026/)).toBeInTheDocument();
    rerender(<TripOverviewDashboard data={{ ...base, nearestPayment: { currency: "CZK", dueDate: "2026-08-15", id: "payment", remainingAmount: 3500, sourceId: "stay", sourceType: "accommodation", title: "Pronájem auta", tripId: "trip" }, nearestPaymentOverdue: false } as never} tripId="trip" />);
    expect(screen.getByRole("heading", { name: "Další platba" })).toBeInTheDocument();
  });
});
