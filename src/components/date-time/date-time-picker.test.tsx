import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateTimePicker } from "./date-time-picker";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function installMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(), dispatchEvent: vi.fn(), matches, media: query, removeEventListener: vi.fn(),
  })));
}

function Picker({ value = "2026-10-14T14:30", timeZone = "Asia/Seoul" }: { value?: string; timeZone?: string } = {}) {
  const onChange = vi.fn();
  render(<DateTimePicker label="Odjezd" value={value} timeZone={timeZone} onChange={onChange} />);
  return onChange;
}

describe("DateTimePicker", () => {
  it("keeps a local canonical value and exposes the trip timezone", () => {
    installMatchMedia(true);
    const onChange = Picker();
    fireEvent.click(screen.getByRole("button", { name: "Odjezd" }));
    expect(screen.getByText("Asia/Seoul")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /20.*října 2026/i }));
    fireEvent.change(screen.getByLabelText("Čas"), { target: { value: "16:45" } });
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-20T16:45");
  });

  it("does not commit a draft after cancellation with Escape and returns focus", () => {
    installMatchMedia(false);
    const onChange = Picker({ timeZone: "Europe/Prague" });
    const trigger = screen.getByRole("button", { name: "Odjezd" });
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText("Čas"), { target: { value: "16:45" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("allows a local optional datetime to be cleared explicitly", () => {
    installMatchMedia(true);
    const onChange = Picker();
    fireEvent.click(screen.getByRole("button", { name: "Odjezd" }));
    fireEvent.click(screen.getByRole("button", { name: "Vymazat" }));
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
