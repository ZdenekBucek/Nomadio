import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./place-actions", () => ({ createExternalTripPlace: vi.fn(), createTripPlace: vi.fn() }));
vi.mock("./day-place-actions", () => ({ addExternalPlaceToDay: vi.fn(), addManualPlaceToDay: vi.fn() }));
vi.mock("@/features/places/place-preview-map", () => ({ PlacePreviewMap: () => <div>Mapový náhled s pinem</div> }));
import { DayPlaceAdder } from "./day-place-adder";

const result = {
  attribution: "Powered by Geoapify · © OpenStreetMap contributors",
  category: "charging" as const,
  city: "Praha",
  countryCode: "CZ",
  formattedAddress: "Wilsonova 8, Praha, Česko",
  latitude: 50.083,
  longitude: 14.435,
  name: "EV nabíječka",
  provider: "geoapify" as const,
  providerCategories: ["service.vehicle.charging_station"],
  providerPlaceId: "geo-ev-1",
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("DayPlaceAdder", () => {
  it("selects a result and prepares a linked day item without visible coordinate fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [result] }) }));
    const { container } = render(<DayPlaceAdder configured dayId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" mapAccessToken={null} tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    expect(screen.getByText("Přidat místo")).toBeInTheDocument();
    const input = screen.getByRole("combobox", { name: "Název nebo adresa" });
    fireEvent.change(input, { target: { value: "nabíječka" } });
    await act(async () => { vi.advanceTimersByTime(350); await Promise.resolve(); });
    fireEvent.click(screen.getByRole("option").querySelector("button")!);
    expect(screen.getByText("Mapový náhled s pinem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Přidat do dne" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/latitude|longitude/i)).not.toBeInTheDocument();
    expect((container.querySelector('input[name="latitude"]') as HTMLInputElement).value).toBe("50.083");
    fireEvent.change(screen.getByRole("combobox", { name: "Kategorie Nomadia" }), { target: { value: "transport" } });
    expect(screen.getByRole("combobox", { name: "Kategorie Nomadia" })).toHaveValue("transport");
    expect(screen.getByLabelText("Začátek (volitelný)")).toBeInTheDocument();
    expect(screen.getByLabelText("Poznámka (volitelná)")).toBeInTheDocument();
  });
});
