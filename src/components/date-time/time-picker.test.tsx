import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimePicker } from "./time-picker";

describe("TimePicker", () => {
  it("uses a native 24-hour time input and preserves the canonical value in FormData", () => {
    const { container } = render(<form><TimePicker label="Check-in" name="checkInTime" defaultValue="15:00" /></form>);
    const input = screen.getByLabelText("Check-in");

    expect(input).toHaveAttribute("type", "time");
    expect(input).toHaveValue("15:00");
    fireEvent.change(input, { target: { value: "16:30" } });
    expect(new FormData(container.querySelector("form")!).get("checkInTime")).toBe("16:30");
  });

  it("allows an optional time to be cleared", () => {
    render(<TimePicker label="Check-out" name="checkOutTime" defaultValue="10:00" />);
    const input = screen.getByLabelText("Check-out");
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
  });
});
