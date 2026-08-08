import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { pathnameState } = vi.hoisted(() => ({ pathnameState: { value: "/app" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

import { AppNavigation } from "./app-navigation";

afterEach(cleanup);

describe("AppNavigation", () => {
  it("marks the current route and exposes trips while keeping later modules inactive", () => {
    pathnameState.value = "/app";
    render(<AppNavigation />);

    expect(screen.getByRole("link", { name: "Přehled" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Moje cesty" })).toHaveAttribute(
      "href",
      "/app/trips",
    );
    expect(screen.getByText("Itinerář").closest("[aria-disabled='true']"))
      .toBeInTheDocument();
  });

  it("provides a distinct mobile navigation landmark", () => {
    pathnameState.value = "/app";
    render(<AppNavigation mobile />);

    expect(
      screen.getByRole("navigation", { name: "Hlavní mobilní navigace" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cesty")).toBeInTheDocument();
  });

  it("switches to the trip context on a detail route", () => {
    pathnameState.value = "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    render(<AppNavigation />);

    expect(screen.getByRole("navigation", { name: "Navigace cesty" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Moje cesty" })).toHaveAttribute(
      "href",
      "/app/trips",
    );
    expect(screen.getByRole("link", { name: "Přehled" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Ubytování" })).toHaveAttribute(
      "href",
      "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/accommodation",
    );
    expect(screen.getByRole("link", { name: "Itinerář" })).toHaveAttribute(
      "href",
      "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/itinerary",
    );
    expect(screen.getByRole("link", { name: "Mapa" })).toHaveAttribute(
      "href",
      "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/map",
    );
    expect(screen.getByRole("link", { name: "Nastavení cesty" })).toHaveAttribute(
      "href",
      "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/settings",
    );
  });

  it("marks itinerary active on desktop and mobile", () => {
    pathnameState.value = "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/itinerary";
    const { unmount } = render(<AppNavigation />);
    expect(screen.getByRole("link", { name: "Itinerář" })).toHaveAttribute("aria-current", "page");
    unmount();
    render(<AppNavigation mobile />);
    expect(screen.getByRole("link", { name: "Itinerář" })).toHaveAttribute("aria-current", "page");
  });

  it("marks the trip map active on desktop and mobile", () => {
    pathnameState.value = "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/map";
    const { unmount } = render(<AppNavigation />);
    expect(screen.getByRole("link", { name: "Mapa" })).toHaveAttribute("aria-current", "page");
    unmount();
    render(<AppNavigation mobile />);
    expect(screen.getByRole("link", { name: "Mapa" })).toHaveAttribute("aria-current", "page");
  });

  it("marks accommodation active on desktop and mobile", () => {
    pathnameState.value = "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/accommodation";
    const { unmount } = render(<AppNavigation />);
    expect(screen.getByRole("link", { name: "Ubytování" })).toHaveAttribute("aria-current", "page");
    unmount();
    render(<AppNavigation mobile />);
    expect(screen.getByRole("link", { name: "Ubytování" })).toHaveAttribute("aria-current", "page");
  });

  it("marks settings active and links mobile More to it", () => {
    pathnameState.value = "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/settings";
    const { unmount } = render(<AppNavigation />);

    expect(screen.getByRole("link", { name: "Nastavení cesty" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    unmount();
    render(<AppNavigation mobile />);
    expect(screen.getByRole("link", { name: "Více" })).toHaveAttribute(
      "href",
      "/app/trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/settings",
    );
  });
});
