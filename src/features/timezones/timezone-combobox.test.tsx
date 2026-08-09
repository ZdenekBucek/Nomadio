import { fireEvent, render, screen } from "@testing-library/react";
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
});
