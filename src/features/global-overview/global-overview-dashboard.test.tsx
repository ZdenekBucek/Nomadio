import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlobalOverviewDashboard } from "./global-overview-dashboard";

const data = { alerts: [], agenda: [], documents: { important: 0, offline: 0, total: 0 }, dominantMeta: { countryCode: "NO", dayNumber: null, destination: "Moskenes, Norsko", isActive: false, totalDays: 7, travelerCount: 2 }, dominantPreparation: { accommodation: { complete: 6, percent: 100, total: 6 }, budget: [], checklist: { complete: 3, percent: 60, total: 5 }, documents: { complete: 2, percent: 100, total: 2 }, packing: { packed: 0, remaining: 0, total: 0 } }, dominantTrip: { cover_url: null, cover_variant: "violet", end_date: "2099-08-20", id: "trip-a", name: "Norsko", start_date: "2099-08-14", status: "planning" }, nextEvent: null, openTasks: [], payments: [], stats: { active: 0, completed: 2, upcoming: 1 }, upcoming: [] };

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
});
