import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Nomadio foundation", () => {
  it("presents the product foundation and links to authentication", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "Technický základ pro klidnější cestování.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Přihlásit se" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
