import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapPlaceForm } from "./map-place-form";

afterEach(()=>{cleanup();vi.unstubAllGlobals();});

describe("MapPlaceForm",()=>{
  it("loads, exposes and lets the user edit a reverse-geocoded address",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({address:"Karlův most, Praha"})}));
    render(<MapPlaceForm draft={{latitude:50.087123,longitude:14.407456}} onCancel={()=>{}} tripId="trip"/>);
    expect(screen.getByText("Hledám adresu…")).toBeInTheDocument();
    const input=await screen.findByLabelText("Adresa");
    await waitFor(()=>expect(input).toHaveValue("Karlův most, Praha"));
    fireEvent.change(input,{target:{value:"Moje upravená adresa"}});
    expect(input).toHaveValue("Moje upravená adresa");
  });

  it.each([
    {ok:true,json:async()=>({address:null})},
    {ok:false,json:async()=>({})},
  ])("keeps saving available when no address can be resolved",async(response)=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(response));
    render(<MapPlaceForm draft={{latitude:50,longitude:14}} onCancel={()=>{}} tripId="trip"/>);
    expect(await screen.findByText(/Adresu se nepodařilo zjistit/)).toBeInTheDocument();
    expect(screen.getByLabelText("Adresa")).toHaveValue("");
    expect(screen.getByRole("button",{name:"Uložit místo"})).toBeEnabled();
  });

  it("ignores a stale response after a second map click",async()=>{
    let resolveFirst!:(value:unknown)=>void;
    const first=new Promise((resolve)=>{resolveFirst=resolve;});
    const fetchMock=vi.fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({ok:true,json:async()=>({address:"Nová adresa"})});
    vi.stubGlobal("fetch",fetchMock);
    const {rerender}=render(<MapPlaceForm key="50:14" draft={{latitude:50,longitude:14}} onCancel={()=>{}} tripId="trip"/>);
    rerender(<MapPlaceForm key="49:16" draft={{latitude:49,longitude:16}} onCancel={()=>{}} tripId="trip"/>);
    await waitFor(()=>expect(screen.getByLabelText("Adresa")).toHaveValue("Nová adresa"));
    resolveFirst({ok:true,json:async()=>({address:"Stará adresa"})});
    await Promise.resolve();
    expect(screen.getByLabelText("Adresa")).toHaveValue("Nová adresa");
  });

  it("shows map placement feedback, preserves hidden coordinates and cancels without submitting",()=>{vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error()));const onCancel=vi.fn();const {container}=render(<MapPlaceForm draft={{latitude:50.087123,longitude:14.407456}} onCancel={onCancel} tripId="trip"/>);expect(screen.getByText("Bod je umístěn na mapě")).toBeInTheDocument();expect(screen.queryByLabelText("Latitude")).not.toBeInTheDocument();expect(screen.queryByLabelText("Longitude")).not.toBeInTheDocument();expect(container.querySelector<HTMLInputElement>('input[name="latitude"]')).toHaveValue("50.087123");expect(container.querySelector<HTMLInputElement>('input[name="longitude"]')).toHaveValue("14.407456");fireEvent.click(screen.getByRole("button",{name:"Zrušit"}));expect(onCancel).toHaveBeenCalledOnce();});
  it("offers atomic addition from a day and defaults to custom",()=>{vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error()));render(<MapPlaceForm dayId="day" draft={{latitude:50,longitude:14}} onCancel={()=>{}} tripId="trip"/>);expect(screen.getByRole("checkbox",{name:/Přidat rovnou/})).toBeChecked();expect(screen.getByLabelText("Kategorie Nomadia")).toHaveValue("custom");});
  it("prepares a map-selected place for the unified itinerary flow",()=>{vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error()));const {container}=render(<MapPlaceForm continueToItinerary dayId="day" draft={{latitude:50,longitude:14}} onCancel={()=>{}} tripId="trip"/>);expect(screen.getByText("Po uložení doplníte položku itineráře")).toBeInTheDocument();expect(screen.queryByRole("checkbox",{name:/Přidat rovnou/})).not.toBeInTheDocument();expect(container.querySelector('input[name="continueToItinerary"]')).toHaveValue("on");});
});
