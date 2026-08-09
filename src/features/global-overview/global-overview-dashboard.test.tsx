import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GlobalOverviewDashboard } from "./global-overview-dashboard";

const data = { alerts: [], agenda: [], documents: { important: 0, offline: 0, total: 0 }, dominantMeta: { countryCode: "NO", dayNumber: null, destination: "Moskenes, Norsko", isActive: false, totalDays: 7, travelerCount: 2 }, dominantPreparation: { accommodation: { complete: 6, percent: 100, total: 6 }, checklist: { complete: 3, percent: 60, total: 5 }, documents: { complete: 2, percent: 100, total: 2 }, packing: { packed: 0, remaining: 0, total: 0 } }, dominantTrip: { cover_url: null, cover_variant: "violet", end_date: "2099-08-20", id: "trip-a", name: "Norsko", start_date: "2099-08-14", status: "planning" }, financeReality: [], nextEvent: null, openTasks: [], payments: [], stats: { active: 0, completed: 2, upcoming: 1 }, upcoming: [] };

afterEach(cleanup);

describe("GlobalOverviewDashboard", () => {
  it("renders the global dashboard hierarchy and source links", () => {
    const { container } = render(<GlobalOverviewDashboard data={data as never} />);
    expect(screen.getByRole("heading", { name: "Přehled" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Otevřít cestu/ })).toHaveAttribute("href", "/app/trips/trip-a");
    expect(screen.getByRole("heading", { name: "Připravenost cesty" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vše připraveno" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kalendář" })).toHaveAttribute("href", "/app/calendar?view=agenda");
    expect(container.firstElementChild).toHaveClass("overflow-x-clip");
    expect([...container.querySelectorAll("[data-dashboard-section]")].map((item) => item.getAttribute("data-dashboard-section"))).toEqual(["hero", "preparation", "attention", "next-event", "finance", "tasks", "documents"]);
  });

  it("uses the first-trip onboarding state when there are no visible trips", () => {
    render(<GlobalOverviewDashboard data={{ ...data, stats: { active: 0, completed: 0, upcoming: 0 } } as never} />);
    expect(screen.getByRole("heading", { name: "Kam vás zavede další cesta?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vytvořit cestu/ })).toHaveAttribute("href", "/app/trips");
  });

  it("renders global reality per currency and a separate remaining payment", () => {
    render(<GlobalOverviewDashboard data={{
      ...data,
      financeReality: [{ amount: 50000, currency: "CZK" }, { amount: 500, currency: "EUR" }],
      payments: [{ currency: "CZK", dueDate: "2026-08-01", href: "/app/trips/trip-a/accommodation?edit=hotel", id: "hotel", isOverdue: true, remainingAmount: 1200, title: "Hotel", tripName: "Norsko" }],
    } as never} />);

    expect(screen.getByText("Skutečné náklady")).toBeInTheDocument();
    expect(screen.getByText("CZK")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("50 000 Kč")).toBeInTheDocument();
    expect(screen.getByText("500 €")).toBeInTheDocument();
    expect(screen.getByText("1 200 Kč")).toBeInTheDocument();
    expect(screen.getByText("Po splatnosti 2026-08-01")).toBeInTheDocument();
    expect(screen.queryByText(/celkem/i)).not.toBeInTheDocument();
  });
});
