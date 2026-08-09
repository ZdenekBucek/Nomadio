import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TripSettingsSection } from "./trip-settings-section";

afterEach(cleanup);

describe("TripSettingsSection", () => {
  it("opens only the basic section by default and exposes accessible controls", () => {
    render(
      <>
        <TripSettingsSection defaultOpen id="basic" title="Základní informace" description="Údaje" icon={null}>
          <input aria-label="Název cesty" defaultValue="Norsko" />
        </TripSettingsSection>
        <TripSettingsSection id="appearance" title="Vzhled cesty" description="Cover" icon={null}>
          <p>Cover controls</p>
        </TripSettingsSection>
        <TripSettingsSection id="sharing" title="Sdílení a členové" description="Členové" icon={null}>
          <p>Sharing controls</p>
        </TripSettingsSection>
        <TripSettingsSection id="management" title="Správa cesty" description="Lifecycle" icon={null}>
          <p>Management controls</p>
        </TripSettingsSection>
      </>,
    );

    expect(screen.getByRole("button", { name: /Základní informace/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Vzhled cesty/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /Sdílení a členové/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /Správa cesty/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Název cesty")).toBeVisible();
    expect(screen.queryByText("Cover controls")).not.toBeVisible();
  });

  it("toggles with the whole header and preserves mounted form state", () => {
    render(
      <TripSettingsSection id="basic" title="Základní informace" description="Údaje" icon={null}>
        <label>Test<input aria-label="Test" defaultValue="původní" /></label>
      </TripSettingsSection>,
    );

    const trigger = screen.getByRole("button", { name: /Základní informace/ });
    const input = screen.getByLabelText("Test");
    fireEvent.change(input, { target: { value: "upravené" } });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(input).toHaveValue("upravené");
    expect(trigger).toHaveAttribute("aria-controls", "basic");
  });
});
