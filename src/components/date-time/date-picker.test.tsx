import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatePicker } from "./date-picker";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function installMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches,
    media: query,
    removeEventListener: vi.fn(),
  })));
}

describe("DatePicker", () => {
  it("commits a canonical selected date to FormData", () => {
    installMatchMedia(false);
    const { container } = render(<form><DatePicker label="Splatnost" name="balanceDueDate" defaultValue="2026-10-14" /></form>);

    fireEvent.click(screen.getByRole("button", { name: "Splatnost" }));
    fireEvent.click(screen.getByRole("button", { name: /20.*října 2026/i }));
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));

    expect(new FormData(container.querySelector("form")!).get("balanceDueDate")).toBe("2026-10-20");
  });

  it("clears an optional value and restores it when cancellation uses Escape", () => {
    installMatchMedia(false);
    const { container } = render(<form><DatePicker label="Splatnost" name="balanceDueDate" defaultValue="2026-10-14" /></form>);
    const trigger = screen.getByRole("button", { name: "Splatnost" });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Vymazat" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(new FormData(container.querySelector("form")!).get("balanceDueDate")).toBe("2026-10-14");
    expect(trigger).toHaveFocus();
  });

  it("clears a value after explicit confirmation", () => {
    installMatchMedia(true);
    const { container } = render(<form><DatePicker label="Splatnost" name="balanceDueDate" defaultValue="2026-10-14" /></form>);

    fireEvent.click(screen.getByRole("button", { name: "Splatnost" }));
    fireEvent.click(screen.getByRole("button", { name: "Vymazat" }));
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));

    expect(new FormData(container.querySelector("form")!).get("balanceDueDate")).toBe("");
  });
});
