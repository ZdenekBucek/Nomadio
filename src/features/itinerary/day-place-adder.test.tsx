import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./place-actions", () => ({ createExternalTripPlace: vi.fn(), createTripPlace: vi.fn() }));
vi.mock("./day-place-actions", () => ({ addExternalPlaceToDay: vi.fn(), addManualPlaceToDay: vi.fn() }));
vi.mock("@/features/places/place-preview-map", () => ({ PlacePreviewMap: () => <div>Mapový náhled s pinem</div> }));
vi.mock("./item-actions", () => ({ createItineraryItem: vi.fn() }));
import { ItineraryAddFlow } from "./itinerary-add-flow";

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

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("ItineraryAddFlow", () => {
  it("uses one Timeline action and offers place, activity and note flows", () => {
    const chooseMap = vi.fn();
    render(<ItineraryAddFlow configured dayId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" mapAccessToken="test-map-token" onChooseMap={chooseMap} places={[]} tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    const addItem = screen.getByRole("button", { name: "Přidat položku" });
    expect(addItem).toHaveAttribute("title", "Přidat položku");
    fireEvent.click(addItem);
    expect(screen.getByRole("dialog")).toHaveTextContent("Přidat do itineráře");
    expect(screen.getByRole("button", { name: /^Místo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Aktivita/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Poznámka/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Místo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Vybrat místo z mapy" }));
    expect(chooseMap).toHaveBeenCalledOnce();
  });

  it("links an existing saved place without rendering technical coordinates", () => {
    render(<ItineraryAddFlow configured dayId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" mapAccessToken={null} onChooseMap={vi.fn()} places={[{ ...result, address: result.formattedAddress, attribution:null, category:"charging", category_overridden:false, city:result.city, country_code:result.countryCode, created_at:"", created_by:"user", id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc", latitude:result.latitude, longitude:result.longitude, notes:null, provider:"manual", provider_category:null, provider_place_id:null, trip_id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", updated_at:"" }]} tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    fireEvent.click(screen.getByRole("button", { name: "Přidat položku" }));
    fireEvent.click(screen.getByRole("button", { name: /^Místo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Vybrat z uložených míst" }));
    fireEvent.click(screen.getByRole("button", { name: /EV nabíječka/ }));
    expect(screen.getByText("Místo")).toBeInTheDocument();
    expect(document.querySelector('input[name="placeId"]')).toHaveValue("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    expect(screen.queryByLabelText(/latitude|longitude/i)).not.toBeInTheDocument();
  });
});
