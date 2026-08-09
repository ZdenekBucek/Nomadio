import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TripMapModel } from "./map-view-model";
import { TripMap } from "./trip-map";

const mapboxMock = vi.hoisted(() => ({
  clickHandler:null as null | ((event:{lngLat:{lat:number;lng:number}})=>void),
  previewEvents:[] as string[],
  previewPositions:[] as [number,number][],
}));
vi.mock("mapbox-gl",()=>{
  class Map { addControl(){} fitBounds(){} flyTo(){} on(name:string,handler:(event:{lngLat:{lat:number;lng:number}})=>void){if(name==="click")mapboxMock.clickHandler=handler;} remove(){} }
  class Marker {
    private coordinates:[number,number]|null=null;
    private preview:boolean;
    constructor(options?:{element?:HTMLElement}){this.preview=Boolean(options?.element?.querySelector(".nomadio-map-preview-pin"));}
    addTo(){if(!this.coordinates)throw new Error("Marker added before coordinates");if(this.preview)mapboxMock.previewEvents.push("add");return this;}
    remove(){if(this.preview)mapboxMock.previewEvents.push("remove");}
    setLngLat(coordinates:[number,number]){this.coordinates=coordinates;if(this.preview){mapboxMock.previewEvents.push("set");mapboxMock.previewPositions.push(coordinates);}return this;}
  }
  class LngLatBounds { extend(){return this;} }
  return { default:{Map,Marker,LngLatBounds,NavigationControl:class{}}, Map, Marker, LngLatBounds, NavigationControl:class{} };
});
vi.mock("./map-place-actions",()=>({createMapSelectedPlace:vi.fn()}));

const model: TripMapModel = {
  mapped: [
    {
      address: "Most 1",
      category: "nature",
      city: "Bodø",
      countryCode: "NO",
      id: "saltstraumen",
      latitude: 67.23,
      longitude: 14.61,
      name: "Saltstraumen",
    },
    {
      address: null,
      category: "accommodation",
      city: "Bodø",
      countryCode: "NO",
      id: "hotel",
      latitude: 67.28,
      longitude: 14.4,
      name: "Hotel Bodø",
    },
  ],
  withoutCoordinates: [{ id: "missing", name: "Místo bez GPS" }],
};

afterEach(()=>{cleanup();mapboxMock.clickHandler=null;mapboxMock.previewEvents=[];mapboxMock.previewPositions=[];});

describe("TripMap", () => {
  it("keeps map layers collapsed by default and toggles them accessibly", () => {
    render(<TripMap accessToken={null} canEdit model={model} tripId="trip" />);

    const trigger = screen.getByRole("button", { name: "Vrstvy mapy" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Filtrovat místa podle kategorie" })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Filtrovat místa podle kategorie" })).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Filtrovat místa podle kategorie" })).not.toBeInTheDocument();
  });

  it("captures, moves and cancels a preview pin in safe marker order", async () => {
    const { unmount } = render(<TripMap accessToken="public-token" canEdit model={model} tripId="trip" />);
    fireEvent.click(screen.getByRole("button", { name: "Přidat místo z mapy" }));
    await waitFor(()=>expect(mapboxMock.clickHandler).not.toBeNull());
    act(()=>mapboxMock.clickHandler?.({lngLat:{lat:50.087123,lng:14.407456}}));
    expect(screen.getByText("Nové vlastní místo")).toBeInTheDocument();
    expect(screen.queryByLabelText("Latitude")).not.toBeInTheDocument();
    expect(screen.getByText("Bod je umístěn na mapě")).toBeInTheDocument();
    expect(document.querySelector<HTMLInputElement>('input[name="latitude"]')).toHaveValue("50.087123");
    expect(mapboxMock.previewEvents).toEqual(["set","add"]);
    expect(mapboxMock.previewPositions).toEqual([[14.407456,50.087123]]);
    act(()=>mapboxMock.clickHandler?.({lngLat:{lat:49.2,lng:16.6}}));
    expect(screen.queryByLabelText("Longitude")).not.toBeInTheDocument();
    expect(document.querySelector<HTMLInputElement>('input[name="longitude"]')).toHaveValue("16.6");
    expect(mapboxMock.previewEvents).toEqual(["set","add","set"]);
    expect(mapboxMock.previewPositions.at(-1)).toEqual([16.6,49.2]);
    act(()=>mapboxMock.clickHandler?.({lngLat:{lat:Number.NaN,lng:15}}));
    expect(mapboxMock.previewEvents).toEqual(["set","add","set"]);
    expect(document.querySelector<HTMLInputElement>('input[name="longitude"]')).toHaveValue("16.6");
    fireEvent.click(screen.getByRole("button", { name:"Zrušit" }));
    expect(screen.queryByText("Nové vlastní místo")).not.toBeInTheDocument();
    expect(mapboxMock.previewEvents).toEqual(["set","add","set","remove"]);
    fireEvent.click(screen.getByRole("button", { name:"Přidat místo z mapy" }));
    act(()=>mapboxMock.clickHandler?.({lngLat:{lat:48.1,lng:17.1}}));
    expect(mapboxMock.previewEvents.slice(-2)).toEqual(["set","add"]);
    unmount();
    expect(mapboxMock.previewEvents.at(-1)).toBe("remove");
  });

  it("keeps the preview marker during reverse-geocoding failure and removes it on save",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false,json:async()=>({})}));
    render(<TripMap accessToken="public-token" canEdit model={model} tripId="trip"/>);
    fireEvent.click(screen.getByRole("button",{name:"Přidat místo z mapy"}));
    await waitFor(()=>expect(mapboxMock.clickHandler).not.toBeNull());
    act(()=>mapboxMock.clickHandler?.({lngLat:{lat:50,lng:14}}));
    expect(mapboxMock.previewEvents).toEqual(["set","add"]);
    expect(await screen.findByText(/Adresu se nepodařilo zjistit/)).toBeInTheDocument();
    expect(mapboxMock.previewEvents).toEqual(["set","add"]);
    fireEvent.change(screen.getByLabelText("Název místa"),{target:{value:"Testovací místo"}});
    fireEvent.submit(screen.getByRole("button",{name:"Uložit místo"}).closest("form")!);
    expect(mapboxMock.previewEvents).toEqual(["set","add","remove"]);
  });

  it("shows a clear configuration message to editors without Mapbox", () => {
    const { rerender } = render(<TripMap accessToken={null} canEdit model={model} tripId="trip" />);
    expect(screen.queryByRole("button", { name: "Přidat místo z mapy" })).not.toBeInTheDocument();
    expect(screen.getByText(/vyžaduje nakonfigurovanou Mapbox mapu/)).toBeInTheDocument();
    rerender(<TripMap accessToken={null} canEdit={false} model={model} tripId="trip" />);
    expect(screen.queryByRole("button", { name: "Přidat místo z mapy" })).not.toBeInTheDocument();
    expect(screen.queryByText(/vyžaduje nakonfigurovanou Mapbox mapu/)).not.toBeInTheDocument();
  });

  it("shows the primary add action to an editor with Mapbox", () => {
    render(<TripMap accessToken="public-token" canEdit model={model} tripId="trip" />);
    expect(screen.getByRole("button", { name:"Přidat místo z mapy" })).toBeVisible();
  });

  it("keeps locations and filters usable without a public token", () => {
    render(<TripMap accessToken={null} canEdit model={model} tripId="trip" />);

    expect(screen.getByText("Mapa čeká na připojení Mapboxu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Saltstraumen/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vrstvy mapy" }));
    expect(screen.getByRole("button", { name: /Příroda, 1 míst/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Místo bez GPS")).toBeInTheDocument();
  });

  it("selects a place from the accessible list", () => {
    render(<TripMap accessToken={null} canEdit model={model} tripId="trip" />);

    fireEvent.click(screen.getByRole("button", { name: /Hotel Bodø/ }));

    expect(screen.getByRole("button", { name: /Hotel Bodø/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers charging places as a dedicated map layer", () => {
    const charging = {
      ...model.mapped[0]!,
      category: "charging" as const,
      id: "charger",
      name: "Ionity",
    };
    render(
      <TripMap
        accessToken={null}
        canEdit
        model={{ mapped: [charging], withoutCoordinates: [] }}
        tripId="trip"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vrstvy mapy" }));
    expect(screen.getByRole("button", { name: /Nabíjení, 1 míst/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Nabíjecí místo")).toBeInTheDocument();
  });

  it("filters the visible list by category and restores all layers", () => {
    render(<TripMap accessToken={null} canEdit model={model} tripId="trip" />);

    fireEvent.click(screen.getByRole("button", { name: "Vrstvy mapy" }));
    fireEvent.click(screen.getByRole("button", { name: /Příroda, 1 míst/ }));

    expect(screen.queryByRole("button", { name: /Saltstraumen/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hotel Bodø/ })).toBeInTheDocument();
    expect(screen.getByText("1 z 2 na mapě")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Vše/ }));
    expect(screen.getByRole("button", { name: /Saltstraumen/ })).toBeInTheDocument();
    expect(screen.getByText("2 z 2 na mapě")).toBeInTheDocument();
  });

  it("shows a layer-empty state when the last active category is disabled", () => {
    render(
      <TripMap
        accessToken="public-token"
        canEdit
        model={{ mapped: [model.mapped[0]!], withoutCoordinates: [] }}
        tripId="trip"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vrstvy mapy" }));
    fireEvent.click(screen.getByRole("button", { name: /Příroda, 1 míst/ }));

    expect(screen.getByText("Žádná aktivní vrstva")).toBeInTheDocument();
    expect(screen.getByText("Zapněte vrstvu s uloženými místy.")).toBeInTheDocument();
  });

  it("shows the empty state without coordinates", () => {
    render(
      <TripMap
        accessToken={null}
        canEdit
        model={{ mapped: [], withoutCoordinates: [] }}
        tripId="trip"
      />,
    );

    expect(screen.getByText("Zatím není co zobrazit")).toBeInTheDocument();
  });
});
