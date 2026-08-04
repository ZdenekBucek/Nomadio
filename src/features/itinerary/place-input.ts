import type { PlaceCategory } from "@/lib/supabase/database.types";
import { isPlaceCategory } from "@/features/places/categories";
export type PlaceInput={address:string|null;category:PlaceCategory;city:string|null;countryCode:string|null;latitude:number|null;longitude:number|null;name:string};
type Result={data:PlaceInput;success:true}|{error:"coordinates"|"invalid";success:false};
function optional(value:FormDataEntryValue|null){const text=value?.toString().trim();return text||null}
function coordinate(value:string|null){if(value===null)return null;const parsed=Number(value.replace(",","."));return Number.isFinite(parsed)?parsed:NaN}
export function parsePlace(formData:FormData):Result{
  const name=formData.get("name")?.toString().trim()??"";const address=optional(formData.get("address"));const city=optional(formData.get("city"));const countryCode=optional(formData.get("countryCode"))?.toUpperCase()??null;const category=formData.get("category")?.toString()??"";const rawLatitude=optional(formData.get("latitude"));const rawLongitude=optional(formData.get("longitude"));
  if((rawLatitude===null)!==(rawLongitude===null))return{success:false,error:"coordinates"};const latitude=coordinate(rawLatitude),longitude=coordinate(rawLongitude);
  if(name.length<1||name.length>160||(address?.length??0)>300||(city?.length??0)>120||(countryCode!==null&&!/^[A-Z]{2}$/.test(countryCode))||!isPlaceCategory(category)||latitude!==null&&(!Number.isFinite(latitude)||latitude< -90||latitude>90)||longitude!==null&&(!Number.isFinite(longitude)||longitude< -180||longitude>180))return{success:false,error:"invalid"};
  return{success:true,data:{address,category,city,countryCode,latitude,longitude,name}};
}
