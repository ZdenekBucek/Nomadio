import { describe, expect, it } from "vitest";
import { parseItineraryItem } from "./item-input";
function data(values: Record<string,string>) { const form = new FormData(); Object.entries(values).forEach(([key,value]) => form.set(key,value)); return form; }
describe("parseItineraryItem", () => {
  it("normalizes an activity", () => expect(parseItineraryItem(data({ title:"  Chrám  ", type:"activity", startTime:"09:00", endTime:"10:30", notes:"  Přijít dříve " }))).toEqual({ success:true, data:{ title:"Chrám", type:"activity", startTime:"09:00", endTime:"10:30", notes:"Přijít dříve", placeId:null } }));
  it("accepts a timeless note", () => expect(parseItineraryItem(data({ title:"Koupit SIM", type:"note" }))).toMatchObject({ success:true, data:{ startTime:null, endTime:null, notes:null, placeId:null } }));
  it.each([{ title:"",type:"note" },{ title:"Den",type:"other" },{ title:"Den",type:"activity",startTime:"25:00" }])("rejects invalid item", values => expect(parseItineraryItem(data(values))).toEqual({ success:false,error:"invalid" }));
});
