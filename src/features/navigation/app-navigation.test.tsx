import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { pathnameState } = vi.hoisted(() => ({ pathnameState: { value: "/app" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathnameState.value }));
import { AppNavigation } from "./app-navigation";
afterEach(cleanup);
const trip = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("AppNavigation", () => {
  it("keeps functional global navigation linked and placeholders non-interactive", () => {
    for (const [path, active] of [["/app", "Přehled"], ["/app/trips", "Moje cesty"], ["/app/calendar", "Kalendář"]] as const) {
      pathnameState.value = path; const { unmount } = render(<AppNavigation />);
      expect(screen.getByRole("navigation", { name: "Globální navigace" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: active })).toHaveAttribute("aria-current", "page");
      expect(screen.queryByRole("link", { name: "Mapa" })).not.toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Mapa, brzy" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Finance, brzy" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Dokumenty, brzy" })).toBeInTheDocument();
      unmount();
    }
  });
  it("uses a compact global mobile set with a non-clickable map placeholder", () => { pathnameState.value = "/app/map"; render(<AppNavigation mobile />); expect(screen.getByRole("navigation", { name: "Globální mobilní navigace" })).toBeInTheDocument(); expect(screen.queryByRole("link", { name: "Mapa" })).not.toBeInTheDocument(); expect(screen.getByRole("group", { name: "Mapa, brzy" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Více" })).toHaveAttribute("href", "/app/more"); });
  it("uses the trip navigation with a visible return but without a redundant current-trip card", () => { pathnameState.value = `/app/trips/${trip}`; render(<AppNavigation />); expect(screen.getByRole("navigation", { name: "Navigace cesty" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Moje cesty" })).toHaveAttribute("href", "/app/trips"); expect(screen.queryByText("Aktuální cesta")).not.toBeInTheDocument(); expect(screen.getByRole("link", { name: "Přehled" })).toHaveAttribute("aria-current", "page"); });
  it.each(["itinerary", "map", "budget", "documents"])("marks trip %s without activating global navigation", (section) => { pathnameState.value = `/app/trips/${trip}/${section}`; render(<AppNavigation />); const label = ({ itinerary: "Itinerář", map: "Mapa", budget: "Rozpočet", documents: "Dokumenty" } as Record<string, string>)[section]!; expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page"); expect(screen.queryByRole("navigation", { name: "Globální navigace" })).not.toBeInTheDocument(); });
  it("uses only primary trip actions plus a More button on mobile", () => { pathnameState.value = `/app/trips/${trip}/checklist`; render(<AppNavigation mobile />); expect(screen.getByRole("navigation", { name: "Mobilní navigace cesty" })).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Otevřít další části cesty" })).toHaveAttribute("aria-expanded", "false"); expect(screen.queryByRole("link", { name: "Checklist" })).not.toBeInTheDocument(); });
  it("opens overflow trip modules without duplicating primary tabs", () => { pathnameState.value = `/app/trips/${trip}/documents`; render(<AppNavigation mobile />); fireEvent.click(screen.getByRole("button", { name: "Otevřít další části cesty" })); expect(screen.getByRole("dialog")).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Ubytování" })).toHaveAttribute("href", `/app/trips/${trip}/accommodation`); expect(screen.getByRole("link", { name: "Dokumenty" })).toHaveAttribute("aria-current", "page"); expect(screen.getByRole("group", { name: "Poznámky, brzy" })).toBeInTheDocument(); expect(screen.queryByRole("link", { name: "Poznámky" })).not.toBeInTheDocument(); expect(screen.getByRole("link", { name: "Nastavení cesty" })).toHaveAttribute("href", `/app/trips/${trip}/settings`); expect(screen.queryByRole("link", { name: "Rozpočet" })).not.toBeInTheDocument(); });
  it("does not activate coming-soon routes", () => { pathnameState.value = "/app/map"; render(<AppNavigation />); expect(screen.getByRole("group", { name: "Mapa, brzy" })).not.toHaveAttribute("aria-current", "page"); cleanup(); pathnameState.value = `/app/trips/${trip}/notes`; render(<AppNavigation />); expect(screen.getByRole("group", { name: "Poznámky, brzy" })).not.toHaveAttribute("aria-current", "page"); });
  it("closes the overflow sheet when navigating to another module", () => { pathnameState.value = `/app/trips/${trip}/checklist`; render(<AppNavigation mobile />); fireEvent.click(screen.getByRole("button", { name: "Otevřít další části cesty" })); fireEvent.click(screen.getByRole("link", { name: "Ubytování" })); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); });
});
