import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./place-actions", () => ({ createExternalTripPlace: vi.fn(), createTripPlace: vi.fn() }));
vi.mock("./day-place-actions", () => ({ addExternalPlaceToDay: vi.fn(), addManualPlaceToDay: vi.fn() }));
vi.mock("@/features/places/place-preview-map", () => ({ PlacePreviewMap: () => <div>Mapový náhled</div> }));
import { PlaceSearch } from "./place-search";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
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
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PlaceSearch", () => {
  it("keeps a safe no-coordinate fallback when Geoapify is not configured", () => {
    render(<PlaceSearch configured={false} mapAccessToken={null} tripId={tripId} />);
    const input = screen.getByRole("combobox", { name: "Název nebo adresa" });
    fireEvent.change(input, { target: { value: "Vlastní místo" } });
    expect(screen.getByText("Vyhledávání míst zatím není připojené")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Uložit „Vlastní místo“ bez souřadnic/ })).toBeInTheDocument();
  });

  it("debounces requests and aborts a stale search", async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      return new Promise<Response>(() => undefined);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<PlaceSearch configured mapAccessToken={null} tripId={tripId} />);
    const input = screen.getByRole("combobox", { name: "Název nebo adresa" });
    fireEvent.change(input, { target: { value: "Hotel" } });
    await act(async () => { vi.advanceTimersByTime(349); });
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: "Hotel Praha" } });
    expect(signals[0]?.aborted).toBe(true);
  });

  it("selects a result with the keyboard, passes hidden coordinates, and allows category override", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [result] }) }));
    const { container } = render(<PlaceSearch configured mapAccessToken={null} tripId={tripId} />);
    const input = screen.getByRole("combobox", { name: "Název nebo adresa" });
    fireEvent.change(input, { target: { value: "nabíječka" } });
    await act(async () => { vi.advanceTimersByTime(350); await Promise.resolve(); });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Vybrané místo")).toBeInTheDocument();
    expect((container.querySelector('input[name="latitude"]') as HTMLInputElement).value).toBe("50.083");
    expect((container.querySelector('input[name="longitude"]') as HTMLInputElement).value).toBe("14.435");
    const category = screen.getByRole("combobox", { name: "Kategorie Nomadia" }) as HTMLSelectElement;
    expect(category.value).toBe("charging");
    fireEvent.change(category, { target: { value: "transport" } });
    expect(category.value).toBe("transport");
  });
});
