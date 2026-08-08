import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { pathnameState } = vi.hoisted(() => ({ pathnameState: { value: "/app" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathnameState.value }));
import { AppNavigation } from "./app-navigation";
afterEach(cleanup);
const trip = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("AppNavigation", () => {
  it("uses the global navigation for app, trips, map and documents", () => {
    for (const [path, active] of [["/app", "Přehled"], ["/app/trips", "Moje cesty"], ["/app/map", "Mapa"], ["/app/documents", "Dokumenty"]] as const) {
      pathnameState.value = path; const { unmount } = render(<AppNavigation />);
      expect(screen.getByRole("navigation", { name: "Globální navigace" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: active })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("href", "/app/finance");
      unmount();
    }
  });
  it("uses a compact global mobile set", () => { pathnameState.value = "/app/map"; render(<AppNavigation mobile />); expect(screen.getByRole("navigation", { name: "Globální mobilní navigace" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Mapa" })).toHaveAttribute("aria-current", "page"); expect(screen.getByRole("link", { name: "Více" })).toHaveAttribute("href", "/app/more"); });
  it("uses the trip navigation and a visible return for a trip route", () => { pathnameState.value = `/app/trips/${trip}`; render(<AppNavigation />); expect(screen.getByRole("navigation", { name: "Navigace cesty" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Moje cesty" })).toHaveAttribute("href", "/app/trips"); expect(screen.getByText("Aktuální cesta")).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Přehled" })).toHaveAttribute("aria-current", "page"); });
  it.each(["itinerary", "map", "budget", "documents"])("marks trip %s without activating global navigation", (section) => { pathnameState.value = `/app/trips/${trip}/${section}`; render(<AppNavigation />); const label = ({ itinerary: "Itinerář", map: "Mapa", budget: "Rozpočet", documents: "Dokumenty" } as Record<string, string>)[section]!; expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page"); expect(screen.queryByRole("navigation", { name: "Globální navigace" })).not.toBeInTheDocument(); });
  it("uses only primary trip actions plus More on mobile", () => { pathnameState.value = `/app/trips/${trip}/checklist`; render(<AppNavigation mobile />); expect(screen.getByRole("navigation", { name: "Mobilní navigace cesty" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Více" })).toHaveAttribute("aria-current", "page"); expect(screen.queryByRole("link", { name: "Checklist" })).not.toBeInTheDocument(); });
});
