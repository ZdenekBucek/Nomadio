import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, reverseMock } = vi.hoisted(() => ({ createClientMock:vi.fn(), reverseMock:vi.fn() }));
vi.mock("@/lib/supabase/server",()=>({createClient:createClientMock}));
vi.mock("@/features/places/geoapify",()=>({
  GeoapifySearchError:class GeoapifySearchError extends Error { constructor(public kind:"provider"|"timeout",public status?:number){super();} },
  reverseGeocodeGeoapify:reverseMock,
}));
import { GeoapifySearchError } from "@/features/places/geoapify";
import { GET } from "./route";

const tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const originalKey=process.env.GEOAPIFY_API_KEY;
function client(role="owner"){
  const results={trips:{data:{id:tripId,status:"planning"},error:null},trip_members:{data:{role},error:null}};
  return {auth:{getUser:vi.fn(async()=>({data:{user:{id:"user"}}}))},from:vi.fn((table:keyof typeof results)=>{const builder={select:vi.fn(()=>builder),eq:vi.fn(()=>builder),maybeSingle:vi.fn(async()=>results[table])};return builder;})};
}

beforeEach(()=>{process.env.GEOAPIFY_API_KEY="not-a-secret";createClientMock.mockReset().mockResolvedValue(client());reverseMock.mockReset();});
afterEach(()=>{if(originalKey===undefined)delete process.env.GEOAPIFY_API_KEY;else process.env.GEOAPIFY_API_KEY=originalKey;});

describe("Geoapify reverse route",()=>{
  it("rejects invalid coordinates before provider access",async()=>{const response=await GET(new Request(`http://localhost/api/geoapify/reverse?tripId=${tripId}&latitude=91&longitude=14`));expect(response.status).toBe(400);expect(reverseMock).not.toHaveBeenCalled();});
  it("returns a normalized address",async()=>{reverseMock.mockResolvedValue("Karlův most, Praha");const response=await GET(new Request(`http://localhost/api/geoapify/reverse?tripId=${tripId}&latitude=50.08&longitude=14.41`));expect(await response.json()).toEqual({address:"Karlův most, Praha"});expect(reverseMock).toHaveBeenCalledWith(expect.objectContaining({latitude:50.08,longitude:14.41}));});
  it("returns null when no address is found",async()=>{reverseMock.mockResolvedValue(null);const response=await GET(new Request(`http://localhost/api/geoapify/reverse?tripId=${tripId}&latitude=50&longitude=14`));expect(await response.json()).toEqual({address:null});});
  it("handles provider errors safely",async()=>{reverseMock.mockRejectedValue(new GeoapifySearchError("provider",500));const response=await GET(new Request(`http://localhost/api/geoapify/reverse?tripId=${tripId}&latitude=50&longitude=14`));expect(response.status).toBe(502);expect(JSON.stringify(await response.json())).not.toContain("not-a-secret");});
});
