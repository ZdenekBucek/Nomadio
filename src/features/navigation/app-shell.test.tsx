import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("./app-navigation", () => ({
  AppNavigation: ({ mobile = false }: { mobile?: boolean }) => (
    <nav aria-label={mobile ? "Mobilní navigace" : "Navigace"}>
      {mobile ? "mobilní navigace" : "navigace"}
    </nav>
  ),
}));

import { AppShell } from "./app-shell";

const profile = {
  avatarUrl: null,
  defaultCurrency: "CZK",
  displayName: "Zdeněk Buček",
  email: "zdenek@example.com",
  initials: "ZB",
  locale: "cs-CZ",
  quickExpenseFabEnabled: false,
  timezone: "Europe/Prague",
};

describe("AppShell", () => {
  it("keeps the account footer but does not render the removed Online/PWA status UI", () => {
    const { container } = render(
      <AppShell profile={profile}>
        <p>Obsah cesty</p>
      </AppShell>,
    );

    expect(screen.getByText("Zdeněk Buček")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Odhlásit" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Mobilní navigace" })).toBeInTheDocument();
    expect(screen.queryByText("Online")).not.toBeInTheDocument();
    expect(screen.queryByText("PWA")).not.toBeInTheDocument();
    expect(container.innerHTML).toContain("env(safe-area-inset-bottom)");
    expect(container.innerHTML).toContain("pb-[calc(5rem+env(safe-area-inset-bottom))]");
  });
});
