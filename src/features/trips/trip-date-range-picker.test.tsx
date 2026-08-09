import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TripForm } from "./trip-form";
import { TripSettingsForm } from "./trip-settings-form";

afterEach(cleanup);

describe("trip date range picker integrations", () => {
  it("uses one date range trigger and canonical hidden fields when creating a trip", () => {
    const { container } = render(
      <TripForm
        countries={[{ code: "NO", continent: "europe", name: "Norsko" }]}
        defaultCurrency="NOK"
        defaultTimezone="Europe/Oslo"
      />,
    );

    expect(screen.getByRole("button", { name: "Termín cesty" })).toBeVisible();
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument();
    expect(container.querySelector('input[name="startDate"]')).toHaveAttribute("type", "hidden");
    expect(container.querySelector('input[name="endDate"]')).toHaveAttribute("type", "hidden");
  });

  it("loads the existing trip range in settings and respects read-only access", () => {
    const { container } = render(
      <TripSettingsForm
        canEdit={false}
        cover={{ imageUrl: null, variant: "violet" }}
        trip={{
          id: "trip-1",
          name: "Norsko 2026",
          start_date: "2026-08-14",
          end_date: "2026-08-28",
        } as never}
      />,
    );

    expect(screen.getByRole("button", { name: "Termín cesty" })).toBeDisabled();
    expect(container.querySelector('input[name="startDate"]')).toHaveValue("2026-08-14");
    expect(container.querySelector('input[name="endDate"]')).toHaveValue("2026-08-28");
  });

  it("replaces the saved settings range with canonical values", () => {
    const { container } = render(
      <TripSettingsForm
        canEdit
        cover={{ imageUrl: null, variant: "violet" }}
        trip={{
          id: "trip-1",
          name: "Norsko 2026",
          start_date: "2026-08-14",
          end_date: "2026-08-28",
        } as never}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Termín cesty" }));
    fireEvent.click(screen.getByRole("button", { name: /20.*srpna 2026/i }));
    fireEvent.click(screen.getByRole("button", { name: /25.*srpna 2026/i }));
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));

    expect(container.querySelector('input[name="startDate"]')).toHaveValue("2026-08-20");
    expect(container.querySelector('input[name="endDate"]')).toHaveValue("2026-08-25");
  });
});
