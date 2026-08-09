import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateRangePicker } from "./date-range-picker";

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

describe("DateRangePicker", () => {
  it("writes canonical date-only values to FormData after selecting a range", () => {
    installMatchMedia(false);
    const { container } = render(
      <form>
        <DateRangePicker defaultStartDate="2026-10-14" startName="startDate" endName="endDate" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Termín cesty" }));
    fireEvent.click(screen.getByRole("button", { name: /28.*října 2026/i }));
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));

    const data = new FormData(container.querySelector("form")!);
    expect(data.get("startDate")).toBe("2026-10-14");
    expect(data.get("endDate")).toBe("2026-10-28");
  });

  it("keeps the existing range when the picker is cancelled with Escape", () => {
    installMatchMedia(false);
    const { container } = render(
      <form>
        <DateRangePicker defaultStartDate="2026-10-14" defaultEndDate="2026-10-28" startName="startDate" endName="endDate" />
      </form>,
    );

    const trigger = screen.getByRole("button", { name: "Termín cesty" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: /20.*října 2026/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    const data = new FormData(container.querySelector("form")!);
    expect(data.get("startDate")).toBe("2026-10-14");
    expect(data.get("endDate")).toBe("2026-10-28");
    expect(trigger).toHaveFocus();
  });

  it("uses a viewport-positioned popover on desktop", () => {
    installMatchMedia(true);
    render(<DateRangePicker startName="startDate" endName="endDate" />);

    fireEvent.click(screen.getByRole("button", { name: "Termín cesty" }));
    expect(screen.getByText("Potvrdit")).toBeInTheDocument();
    expect(document.querySelector(".backdrop-blur-sm")).not.toBeInTheDocument();
  });
});
