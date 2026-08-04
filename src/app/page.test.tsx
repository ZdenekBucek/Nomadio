import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Nomadio foundation", () => {
  it("presents the product foundation without exposing unfinished features", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "Technický základ pro klidnější cestování.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Přihlášení přes Google přijde v další fázi/,
      }),
    ).toBeDisabled();
  });
});
