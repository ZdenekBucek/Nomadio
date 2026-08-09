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
});
