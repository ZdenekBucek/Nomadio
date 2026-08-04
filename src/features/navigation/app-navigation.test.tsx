import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

import { AppNavigation } from "./app-navigation";

describe("AppNavigation", () => {
  it("marks the current route and keeps unfinished modules inactive", () => {
    render(<AppNavigation />);

    expect(screen.getByRole("link", { name: "Přehled" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Moje cesty").closest("[aria-disabled='true']"))
      .toBeInTheDocument();
  });

  it("provides a distinct mobile navigation landmark", () => {
    render(<AppNavigation mobile />);

    expect(
      screen.getByRole("navigation", { name: "Hlavní mobilní navigace" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cesty")).toBeInTheDocument();
  });
});
