import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TripQuickExpenseSettings } from "./trip-quick-expense-settings";

vi.mock("./settings-actions", () => ({
  updateTripQuickExpenseBeforeStart: vi.fn(),
}));

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

afterEach(cleanup);

describe("TripQuickExpenseSettings", () => {
  it("renders the default-off toggle and global master-switch note", () => {
    render(<TripQuickExpenseSettings canEdit enabled={false} globalEnabled={false} tripId={tripId} />);

    expect(screen.getByRole("button", { name: "Povolit rychlé výdaje před začátkem cesty" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Globální rychlé přidávání výdajů je aktuálně vypnuté.")).toBeInTheDocument();
  });

  it("submits the inverse boolean value for enabled and disabled states", () => {
    const { rerender } = render(<TripQuickExpenseSettings canEdit enabled={false} globalEnabled tripId={tripId} />);
    expect(screen.getByRole("button", { name: "Povolit rychlé výdaje před začátkem cesty" })).toHaveValue("true");

    rerender(<TripQuickExpenseSettings canEdit enabled globalEnabled tripId={tripId} />);
    expect(screen.getByRole("button", { name: "Zakázat rychlé výdaje před začátkem cesty" })).toHaveValue("false");
  });

  it("is read-only for viewers and archived trips", () => {
    render(<TripQuickExpenseSettings canEdit={false} enabled={false} globalEnabled tripId={tripId} />);
    const toggle = screen.getByRole("button", { name: "Povolit rychlé výdaje před začátkem cesty" });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
