import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TripPlaceRow } from "@/lib/supabase/database.types";

vi.mock("./place-actions", () => ({ createMapboxTripPlace:vi.fn(), createTripPlace:vi.fn(), removeTripPlace:vi.fn(), updateTripPlace:vi.fn() }));
import { TripPlaces } from "./trip-places";

const place:TripPlaceRow={address:"Most 1",attribution:null,category:"nature",category_overridden:true,city:"Bodø",country_code:"NO",created_at:"2026-08-04T00:00:00Z",created_by:"user",id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",latitude:67.23,longitude:14.61,name:"Saltstraumen",provider:"manual",provider_category:null,provider_place_id:null,trip_id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",updated_at:"2026-08-04T00:00:00Z"};

afterEach(cleanup);

describe("TripPlaces",()=>{
  it("shows compact place metadata and an icon-only edit action",()=>{
    render(<TripPlaces canEdit geoapifyConfigured={false} mapAccessToken={null} places={[place]} tripId={place.trip_id}/>);

    expect(screen.getByText("Saltstraumen")).toBeInTheDocument();
    expect(screen.getByText("Most 1 · Bodø · NO")).toBeInTheDocument();
    expect(screen.queryByText("67.23000, 14.61000")).not.toBeInTheDocument();
    expect(screen.getAllByText("Příroda")).toHaveLength(3);
    const category = screen.getAllByText("Příroda").find((element) => element.closest("article"));
    expect(category).toHaveClass("shrink-0", "px-2");
    expect(category?.parentElement).toHaveClass("items-center");
    expect(screen.getByText("Přidat vlastní místo ručně")).toBeInTheDocument();
    const edit = screen.getByLabelText("Upravit místo");
    expect(edit).toHaveAttribute("title", "Upravit místo");
    expect(edit).toHaveClass("md:opacity-0", "md:group-hover:opacity-100", "md:group-focus-within:opacity-100");
    expect(edit).toHaveClass("min-h-10", "min-w-10");
    expect(edit.closest("article")).toHaveClass("group", "hover:border-primary/35", "focus-within:border-primary/35");
    expect(edit.closest("details")).not.toHaveClass("mt-3", "border", "p-3");

    fireEvent.click(edit);
    expect(edit.closest("details")).toHaveAttribute("open");
    expect(screen.getByDisplayValue("Saltstraumen")).toBeInTheDocument();
  });

  it("renders a charging place with its own category",()=>{render(<TripPlaces canEdit={false} geoapifyConfigured={false} mapAccessToken={null} places={[{...place,category:"charging",name:"Ionity"}]} tripId={place.trip_id}/>);expect(screen.getByText("Ionity")).toBeInTheDocument();expect(screen.getByText("Nabíjecí místo")).toBeInTheDocument()});

  it("keeps places read-only for viewer",()=>{render(<TripPlaces canEdit={false} geoapifyConfigured={false} mapAccessToken={null} places={[place]} tripId={place.trip_id}/>);expect(screen.getByText("Saltstraumen")).toBeInTheDocument();expect(screen.queryByLabelText("Upravit místo")).not.toBeInTheDocument();expect(screen.queryByRole("button")).not.toBeInTheDocument()});
});
