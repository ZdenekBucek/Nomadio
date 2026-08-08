import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DayMapModel } from "./day-map-view-model";
import { DayMap } from "./day-map";

const dayMapboxMock=vi.hoisted(()=>({clickHandler:null as null|((event:{lngLat:{lat:number;lng:number}})=>void),previewEvents:[] as string[],previewPositions:[] as [number,number][]}));
vi.mock("mapbox-gl",()=>{
  class Map { addControl(){} addLayer(){} addSource(){} fitBounds(){} flyTo(){} on(name:string,handler:(event:{lngLat:{lat:number;lng:number}})=>void){if(name==="click")dayMapboxMock.clickHandler=handler;} once(){} remove(){} }
  class Marker { private coordinates:[number,number]|null=null;private preview:boolean;constructor(options?:{element?:HTMLElement}){this.preview=Boolean(options?.element?.querySelector(".nomadio-map-preview-pin"));}addTo(){if(!this.coordinates)throw new Error("Marker added before coordinates");if(this.preview)dayMapboxMock.previewEvents.push("add");return this;}remove(){if(this.preview)dayMapboxMock.previewEvents.push("remove");}setLngLat(coordinates:[number,number]){this.coordinates=coordinates;if(this.preview){dayMapboxMock.previewEvents.push("set");dayMapboxMock.previewPositions.push(coordinates);}return this;} }
  class LngLatBounds { extend(){return this;} }
  return{default:{Map,Marker,LngLatBounds,NavigationControl:class{}},Map,Marker,LngLatBounds,NavigationControl:class{}};
});
vi.mock("./map-place-actions",()=>({createMapSelectedPlace:vi.fn()}));

const model: DayMapModel = {
  points: [
    {
      address: "Hlavní 1",
      category: "sight",
      city: "Praha",
      countryCode: "CZ",
      itemId: "first",
      itemTitle: "Pražský hrad",
      itemType: "activity",
      latitude: 50.09,
      longitude: 14.4,
      placeId: "castle",
      placeName: "Pražský hrad",
      sequence: 1,
      timeLabel: "09:00–11:00",
    },
    {
      address: null,
      category: "food",
      city: "Praha",
      countryCode: "CZ",
      itemId: "second",
      itemTitle: "Oběd",
      itemType: "activity",
      latitude: 50.08,
      longitude: 14.42,
      placeId: "restaurant",
      placeName: "Lokál",
      sequence: 2,
      timeLabel: "12:00",
    },
  ],
  unlinkedItemCount: 1,
  withoutCoordinates: [
    { itemId: "missing", itemTitle: "Večeře", placeName: "Bistro" },
  ],
};

afterEach(()=>{cleanup();vi.unstubAllGlobals();dayMapboxMock.clickHandler=null;dayMapboxMock.previewEvents=[];dayMapboxMock.previewPositions=[];});

describe("DayMap", () => {
  it("creates one preview marker, moves it and cleans it up safely",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("provider")));
    const {unmount}=render(<DayMap accessToken="public-token" canEdit dayId="day" model={{points:[],unlinkedItemCount:0,withoutCoordinates:[]}} tripId="trip"/>);
    fireEvent.click(screen.getByRole("button",{name:"Přidat vlastní místo"}));
    await waitFor(()=>expect(dayMapboxMock.clickHandler).not.toBeNull());
    act(()=>dayMapboxMock.clickHandler?.({lngLat:{lat:50,lng:14}}));
    expect(dayMapboxMock.previewEvents).toEqual(["set","add"]);
    expect(screen.getByText("Nové vlastní místo")).toBeInTheDocument();
    act(()=>dayMapboxMock.clickHandler?.({lngLat:{lat:49,lng:16}}));
    expect(dayMapboxMock.previewEvents).toEqual(["set","add","set"]);
    expect(dayMapboxMock.previewPositions).toEqual([[14,50],[16,49]]);
    act(()=>dayMapboxMock.clickHandler?.({lngLat:{lat:Number.NaN,lng:17}}));
    expect(dayMapboxMock.previewEvents).toEqual(["set","add","set"]);
    fireEvent.click(screen.getByRole("button",{name:"Zrušit"}));
    expect(dayMapboxMock.previewEvents.at(-1)).toBe("remove");
    fireEvent.click(screen.getByRole("button",{name:"Přidat vlastní místo"}));
    act(()=>dayMapboxMock.clickHandler?.({lngLat:{lat:48,lng:17}}));
    unmount();
    expect(dayMapboxMock.previewEvents.at(-1)).toBe("remove");
  });

  it("does not remove the day preview on reverse error and removes it on save",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false,json:async()=>({})}));
    render(<DayMap accessToken="public-token" canEdit dayId="day" model={{points:[],unlinkedItemCount:0,withoutCoordinates:[]}} tripId="trip"/>);
    fireEvent.click(screen.getByRole("button",{name:"Přidat vlastní místo"}));
    await waitFor(()=>expect(dayMapboxMock.clickHandler).not.toBeNull());
    act(()=>dayMapboxMock.clickHandler?.({lngLat:{lat:50,lng:14}}));
    expect(await screen.findByText(/Adresu se nepodařilo zjistit/)).toBeInTheDocument();
    expect(dayMapboxMock.previewEvents).toEqual(["set","add"]);
    fireEvent.change(screen.getByLabelText("Název místa"),{target:{value:"Místo dne"}});
    fireEvent.submit(screen.getByRole("button",{name:"Uložit místo"}).closest("form")!);
    expect(dayMapboxMock.previewEvents.at(-1)).toBe("remove");
  });

  it("hides map selection from viewers", () => {
    render(<DayMap accessToken={null} canEdit={false} dayId="day" model={model} tripId="trip" />);
    expect(screen.queryByRole("button", { name: "Přidat vlastní místo" })).not.toBeInTheDocument();
  });

  it("keeps the ordered day points usable without a public token", () => {
    render(<DayMap accessToken={null} canEdit dayId="day" model={model} tripId="trip" />);

    expect(screen.getByText("Mapa čeká na připojení Mapboxu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pražský hrad/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Bistro")).toBeInTheDocument();
    expect(screen.getByText(/1 bod timeline není propojený/)).toBeInTheDocument();
  });

  it("selects a point and links back to its timeline item", () => {
    render(<DayMap accessToken={null} canEdit dayId="day" model={model} tripId="trip" />);

    fireEvent.click(screen.getByRole("button", { name: /Oběd/ }));

    expect(screen.getByRole("button", { name: /Oběd/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("link", { name: "Zobrazit v timeline" })).toHaveAttribute(
      "href",
      "#timeline-item-second",
    );
  });

  it("keeps an empty day map interactive for the first custom place", () => {
    render(
      <DayMap
        accessToken="public-token"
        canEdit
        dayId="day"
        model={{ points: [], unlinkedItemCount: 2, withoutCoordinates: [] }}
        tripId="trip"
      />,
    );

    expect(screen.getByLabelText("Interaktivní mapa bodů dne")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Přidat vlastní místo" })).toBeEnabled();
  });
});
