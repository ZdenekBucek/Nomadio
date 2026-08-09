import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TripOverviewDashboard } from "./trip-overview-dashboard";

afterEach(cleanup);

describe("TripOverviewDashboard finance", () => {
  it("moves attention into the summary grid and presents Budget as a wide plan/reality block", () => {
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

    expect(screen.getByText("Vyžaduje pozornost")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rozpočet" })).toBeInTheDocument();
    expect(screen.getByText("Realita").parentElement).toHaveTextContent("Realita700 Kč/ plán 1 000 Kč");
    expect(screen.getByText(/Zbývá z plánu/)).toHaveTextContent("Zbývá z plánu 300 Kč");
    expect(screen.getByText("Zaplaceno").parentElement).toHaveTextContent("Zaplaceno200 KčZbývá zaplatit500 Kč");
    expect(screen.getByRole("progressbar", { name: /Utraceno 70 %/ })).toHaveAttribute("aria-valuenow", "70");
  });

  it("keeps the real progress above 100 percent while capping only the visual bar", () => {
    const data = { accommodation: { nights: 0, reservations: 0 }, alerts: [{ detail: "Příliš mnoho", href: "/app/trips/trip/budget", id: "alert", title: "Překročený plán" }], coverage: { gapNights: 0, overlapCount: 0 }, dayItems: [], document: { important: 0, offline: 0, total: 0 }, finance: [{ currency: "CZK", paidAmount: 400, planAmount: 1000, realityAmount: 1120, remainingBudget: -120, remainingPayment: 720 }], itinerary: { items: 0, plannedDays: 0, totalDays: 0 }, nearestPayment: null, nearestTransport: null, openTasks: [], packing: { packed: 0, remaining: 0, total: 0 }, selectedDay: null, task: { completed: 0, remaining: 0, total: 0 }, upcomingAccommodation: null } as never;
    render(<TripOverviewDashboard data={data} tripId="trip" />);
    expect(screen.getByText("112 %")).toBeInTheDocument();
    expect(screen.getByText("Překročeno o 120 Kč")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /Utraceno 112 %/ })).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("link", { name: /Vyžaduje pozornost, 1 položek/ })).toHaveAttribute("href", "/app/trips/trip/budget");
  });

  it("uses a safe no-plan state and never renders invalid progress", () => {
    const data = { accommodation: { nights: 0, reservations: 0 }, alerts: [], coverage: { gapNights: 0, overlapCount: 0 }, dayItems: [], document: { important: 0, offline: 0, total: 0 }, finance: [{ currency: "CZK", paidAmount: 10, planAmount: 0, realityAmount: 100, remainingBudget: -100, remainingPayment: 90 }], itinerary: { items: 0, plannedDays: 0, totalDays: 0 }, nearestPayment: null, nearestTransport: null, openTasks: [], packing: { packed: 0, remaining: 0, total: 0 }, selectedDay: null, task: { completed: 0, remaining: 0, total: 0 }, upcomingAccommodation: null } as never;
    render(<TripOverviewDashboard data={data} tripId="trip" />);
    expect(screen.getByText("Rozpočet zatím není naplánovaný.")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it("shows currencies independently without an FX total", () => {
    const data = { accommodation: { nights: 0, reservations: 0 }, alerts: [], coverage: { gapNights: 0, overlapCount: 0 }, dayItems: [], document: { important: 0, offline: 0, total: 0 }, finance: [{ currency: "CZK", paidAmount: 100, planAmount: 1000, realityAmount: 500, remainingBudget: 500, remainingPayment: 900 }, { currency: "EUR", paidAmount: 20, planAmount: 200, realityAmount: 40, remainingBudget: 160, remainingPayment: 180 }], itinerary: { items: 0, plannedDays: 0, totalDays: 0 }, nearestPayment: null, nearestTransport: null, openTasks: [], packing: { packed: 0, remaining: 0, total: 0 }, selectedDay: null, task: { completed: 0, remaining: 0, total: 0 }, upcomingAccommodation: null } as never;
    render(<TripOverviewDashboard data={data} tripId="trip" />);
    expect(screen.getByText("CZK")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.queryByText(/Celkem/)).not.toBeInTheDocument();
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
