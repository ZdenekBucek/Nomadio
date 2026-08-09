import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, redirectMock, revalidatePathMock, rpcMock } = vi.hoisted(() => ({
  getUserMock:vi.fn(), redirectMock:vi.fn((path:string)=>{throw new Error(`REDIRECT:${path}`)}), revalidatePathMock:vi.fn(), rpcMock:vi.fn(),
}));
vi.mock("next/cache",()=>({revalidatePath:revalidatePathMock}));
vi.mock("next/navigation",()=>({redirect:redirectMock}));
vi.mock("@/lib/supabase/server",()=>({createClient:vi.fn(async()=>({auth:{getUser:getUserMock},rpc:rpcMock}))}));
import { createMapSelectedPlace } from "./map-place-actions";

const tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", dayId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function form(day=false){const value=new FormData();value.set("tripId",tripId);value.set("name","Moje vyhlídka");value.set("category","custom");value.set("notes","Západ slunce");value.set("address","Karlův most, Praha");value.set("latitude","50.087");value.set("longitude","14.407");if(day){value.set("dayId",dayId);value.set("addToDay","on");}return value;}

describe("createMapSelectedPlace",()=>{
  beforeEach(()=>{getUserMock.mockReset().mockResolvedValue({data:{user:{id:"user"}}});rpcMock.mockReset().mockResolvedValue({data:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",error:null});redirectMock.mockClear();revalidatePathMock.mockReset();});
  it("stores one manual place selected on the trip map",async()=>{await expect(createMapSelectedPlace(form())).rejects.toThrow("mapPlace=created");expect(rpcMock).toHaveBeenCalledWith("create_map_selected_manual_place",expect.objectContaining({add_to_day:false,target_day_id:null,place_address:"Karlův most, Praha",place_latitude:50.087,place_longitude:14.407}));expect(revalidatePathMock).toHaveBeenCalledWith(`/app/trips/${tripId}/map`);});
  it("atomically adds the selected place to its day",async()=>{await expect(createMapSelectedPlace(form(true))).rejects.toThrow("mapPlace=day-added");expect(rpcMock).toHaveBeenCalledWith("create_map_selected_manual_place",expect.objectContaining({add_to_day:true,target_day_id:dayId,target_trip_id:tripId}));});
  it("continues map-selected places through the unified itinerary form without creating an item yet",async()=>{const value=form();value.set("dayId",dayId);value.set("continueToItinerary","on");await expect(createMapSelectedPlace(value)).rejects.toThrow(`mapPlace=continue&mapPlaceId=cccccccc-cccc-4ccc-8ccc-cccccccccccc`);expect(rpcMock).toHaveBeenCalledWith("create_map_selected_manual_place",expect.objectContaining({add_to_day:false,target_day_id:null,target_trip_id:tripId}));});
  it("stores the place when reverse geocoding produced no address",async()=>{const value=form();value.set("address","");await expect(createMapSelectedPlace(value)).rejects.toThrow("mapPlace=created");expect(rpcMock).toHaveBeenCalledWith("create_map_selected_manual_place",expect.objectContaining({place_address:null}));});
  it("rejects invalid coordinates before database access",async()=>{const value=form();value.set("latitude","91");await expect(createMapSelectedPlace(value)).rejects.toThrow("mapPlace=invalid");expect(rpcMock).not.toHaveBeenCalled();});
});
