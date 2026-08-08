import { describe, expect, it } from "vitest";
import { parseMapPlace } from "./map-place-input";

function form(overrides: Record<string, string> = {}) {
  const value = new FormData();
  Object.entries({ address:"Karlův most, Praha", category:"custom", latitude:"50.087", longitude:"14.407", name:"Moje místo", notes:"Výhled", ...overrides }).forEach(([key, entry]) => value.set(key, entry));
  return value;
}

describe("parseMapPlace", () => {
  it("accepts a named custom place with valid coordinates", () => {
    expect(parseMapPlace(form())).toEqual({ success:true, data:expect.objectContaining({ address:"Karlův most, Praha", category:"custom", latitude:50.087, longitude:14.407, notes:"Výhled" }) });
  });
  it("accepts an empty address", () => {
    expect(parseMapPlace(form({ address:"" }))).toEqual({ success:true, data:expect.objectContaining({ address:null }) });
  });
  it.each([{ name:"" }, { latitude:"" }, { latitude:"91" }, { longitude:"-181" }, { latitude:"not-a-number" }])("rejects invalid name or coordinates: %o", (override) => {
    expect(parseMapPlace(form(override))).toEqual({ success:false });
  });
});
