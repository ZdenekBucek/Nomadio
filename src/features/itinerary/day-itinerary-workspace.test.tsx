import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ItineraryDayRow, ItineraryItemRow, TripPlaceRow } from "@/lib/supabase/database.types";

vi.mock("@/features/places/day-map", () => ({
  DayMap: ({ mapPickRequest, onSelectItem, selectedItemId }: { mapPickRequest?: number; onSelectItem: (itemId: string) => void; selectedItemId: string | null }) => <div><output data-testid="map-selection">{selectedItemId}</output><output data-testid="map-pick-request">{mapPickRequest}</output><button type="button" onClick={() => onSelectItem("second")}>Vybrat marker druhého bodu</button></div>,
}));
vi.mock("./itinerary-add-flow", () => ({ ItineraryAddFlow: ({ onChooseMap }: { onChooseMap: () => void }) => <button type="button" onClick={onChooseMap}>Vybrat místo z mapy</button> }));
vi.mock("./item-actions", () => ({ createItineraryItem: vi.fn(), moveItineraryItem: vi.fn(), moveItineraryItemToDay: vi.fn(), removeItineraryItem: vi.fn(), updateItineraryItem: vi.fn() }));

import { DayItineraryWorkspace } from "./day-itinerary-workspace";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const dayId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const day: ItineraryDayRow = { city:null, created_at:"2026-08-04T00:00:00Z", created_by:"user", day_date:"2026-08-04", id:dayId, is_reserve:false, name:"Den 1", sort_order:null, status:"plan", trip_id:tripId, updated_at:"2026-08-04T00:00:00Z" };
const base = { created_at:"2026-08-04T00:00:00Z", created_by:"user", day_id:dayId, end_time:null, notes:null, updated_at:"2026-08-04T00:00:00Z" };
const items: ItineraryItemRow[] = [{ ...base, id:"first", item_type:"activity", place_id:"castle", start_time:null, sort_order:0, title:"Hrad" }, { ...base, id:"second", item_type:"activity", place_id:"restaurant", start_time:null, sort_order:1, title:"Oběd" }];
const places: TripPlaceRow[] = [
  { address:null, attribution:null, category:"sight", category_overridden:false, city:null, country_code:null, created_at:"2026-08-04T00:00:00Z", created_by:"user", id:"castle", latitude:50, longitude:14, name:"Hrad", notes:null, provider:"manual", provider_category:null, provider_place_id:null, trip_id:tripId, updated_at:"2026-08-04T00:00:00Z" },
  { address:null, attribution:null, category:"food", category_overridden:false, city:null, country_code:null, created_at:"2026-08-04T00:00:00Z", created_by:"user", id:"restaurant", latitude:50.1, longitude:14.1, name:"Oběd", notes:null, provider:"manual", provider_category:null, provider_place_id:null, trip_id:tripId, updated_at:"2026-08-04T00:00:00Z" },
];
const mapModel = { points:[
  { address:null, category:"sight" as const, city:null, countryCode:null, itemId:"first", itemTitle:"Hrad", itemType:"activity" as const, latitude:50, longitude:14, placeId:"castle", placeName:"Hrad", sequence:1, timeLabel:null },
  { address:null, category:"food" as const, city:null, countryCode:null, itemId:"second", itemTitle:"Oběd", itemType:"activity" as const, latitude:50.1, longitude:14.1, placeId:"restaurant", placeName:"Oběd", sequence:2, timeLabel:null },
], unlinkedItemCount:0, withoutCoordinates:[] };

afterEach(cleanup);

describe("DayItineraryWorkspace", () => {
  it("uses one selected item state for Timeline to Map and marker to Timeline", () => {
    render(<DayItineraryWorkspace canEdit dayId={dayId} days={[day]} geoapifyConfigured={false} items={items} mapAccessToken={null} mapModel={mapModel} places={places} tripId={tripId} />);

    expect(screen.getByTestId("map-selection")).toHaveTextContent("first");
    fireEvent.click(screen.getByRole("button", { name: "Vybrat Oběd na mapě" }));
    expect(screen.getByTestId("map-selection")).toHaveTextContent("second");
    expect(document.querySelector("#timeline-item-second")).toHaveAttribute("data-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "Vybrat marker druhého bodu" }));
    expect(document.querySelector("#timeline-item-second")).toHaveAttribute("data-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "Vybrat místo z mapy" }));
    expect(screen.getByTestId("map-pick-request")).toHaveTextContent("1");
  });
});
