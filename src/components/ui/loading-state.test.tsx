import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  it("exposes one polite status with an accessible loading label", () => {
    render(<LoadingState label="Načítání kalendáře…"><div data-testid="skeleton" /></LoadingState>);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Načítání kalendáře…")).toHaveClass("sr-only");
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });
});
