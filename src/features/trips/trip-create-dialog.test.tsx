import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TripCreateDialog } from "./trip-create-dialog";

afterEach(cleanup);

const props = {
  countries: [{ code: "NO", continent: "europe" as const, name: "Norsko" }],
  defaultCurrency: "CZK",
  defaultTimezone: "Europe/Prague",
};

describe("TripCreateDialog", () => {
  it("keeps the existing trip form hidden until the primary CTA is activated", async () => {
    render(<TripCreateDialog {...props} />);

    expect(screen.getByRole("button", { name: "Přidat novou cestu" })).toBeVisible();
    expect(screen.queryByLabelText("Název cesty")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Přidat novou cestu" }));

    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(screen.getByLabelText("Název cesty")).toBeVisible();
    expect(screen.queryByTestId("trip-form-step-icon")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-dialog-layout", "responsive-half");
  });

  it("closes with the explicit close action", async () => {
    render(<TripCreateDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Přidat novou cestu" }));
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Zavřít vytvoření cesty" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Přidat novou cestu" })).toHaveFocus();
  });
});
