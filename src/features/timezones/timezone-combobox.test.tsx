import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimezoneCombobox } from "./timezone-combobox";

describe("TimezoneCombobox", () => {
  it("searches and selects an IANA timezone with a hidden form value", () => {
    render(<form><TimezoneCombobox name="timezone" defaultValue="Europe/Prague" /></form>);

    const input = screen.getByRole("combobox", { name: "Časové pásmo" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Soul" } });
    fireEvent.click(screen.getByRole("option", { name: /SoulAsia\/Seoul/ }));

    expect(screen.getByDisplayValue("Asia/Seoul")).toHaveAttribute("name", "timezone");
  });

  it("retains a valid legacy timezone that is outside the display catalog", () => {
    render(<TimezoneCombobox name="timezone" defaultValue="US/Eastern" />);

    expect(screen.getByDisplayValue("US/Eastern")).toHaveAttribute("name", "timezone");
  });

  it("closes on outside click and blur while keeping selection keyboard accessible", async () => {
    const { container } = render(<div><TimezoneCombobox name="timezone" defaultValue="Europe/Prague" /><button type="button">Mimo</button></div>);
    const view = within(container);
    const input = view.getByRole("combobox", { name: "Časové pásmo" });
    fireEvent.focus(input);
    expect(view.getByRole("listbox")).toBeInTheDocument();
    fireEvent.pointerDown(view.getByRole("button", { name: "Mimo" }));
    expect(view.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Soul" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(view.getByDisplayValue("Asia/Seoul")).toHaveAttribute("name", "timezone");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => expect(view.queryByRole("listbox")).not.toBeInTheDocument());
  });
});
