import { ArrowDown, ArrowRight, ArrowUp, BusFront, Clock3, Lightbulb, MapPin, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { ItineraryDayRow, ItineraryItemRow, ItineraryItemType, TripPlaceRow } from "@/lib/supabase/database.types";
import { createItineraryItem, moveItineraryItem, moveItineraryItemToDay, removeItineraryItem, updateItineraryItem } from "./item-actions";

const control = "mt-2 h-10 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";
const labels = { activity:"Aktivita", transport:"Přesun", note:"Poznámka" } as const;
const icons = { activity:Lightbulb, transport:BusFront, note:StickyNote } as const;
const dayDateFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function DayTimeline({ canEdit, dayId, days, items, places, tripId }: { canEdit:boolean; dayId:string; days:ItineraryDayRow[]; items:ItineraryItemRow[]; places:TripPlaceRow[]; tripId:string }) {
  const targetDays = days.filter((day) => day.id !== dayId).toSorted(compareDays);
  return <div className="grid gap-4">
    {items.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-6 text-center"><Clock3 className="mx-auto size-7 text-primary"/><p className="mt-3 font-medium">Timeline je zatím prázdná</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Přidejte první aktivitu, přesun nebo poznámku.</p></div> : null}
    <ol className="grid gap-3">{items.map((item,index)=><TimelineItem key={item.id} canEdit={canEdit} dayId={dayId} index={index} item={item} places={places} targetDays={targetDays} total={items.length} tripId={tripId}/>)}</ol>
    {canEdit ? <details className="rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[var(--brand-highlight)]"><Plus className="size-4"/> Přidat bod do timeline</summary><form action={createItineraryItem} className="mt-4 grid gap-4 sm:grid-cols-2"><Ids dayId={dayId} tripId={tripId}/><Fields places={places}/><Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start"><Plus/> Přidat bod</Button></form></details> : null}
  </div>;
}

function TimelineItem({ canEdit, dayId, index, item, places, targetDays, total, tripId }: { canEdit:boolean; dayId:string; index:number; item:ItineraryItemRow; places:TripPlaceRow[]; targetDays:ItineraryDayRow[]; total:number; tripId:string }) {
  const Icon = icons[item.item_type]; const time = [formatTime(item.start_time),formatTime(item.end_time)].filter(Boolean).join("–");
  const place = item.place_id ? places.find((candidate) => candidate.id === item.place_id) : null;
  return <li id={`timeline-item-${item.id}`} className="relative scroll-mt-6 rounded-2xl border border-border bg-muted/22 p-4 sm:ml-5"><span className="absolute top-6 -left-[1.7rem] hidden size-3 rounded-full border-2 border-primary bg-background shadow-[0_0_12px_var(--brand-glow)] sm:block"/>
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="size-5"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{item.title}</h2><StatusPill tone={item.item_type === "transport" ? "warning" : item.item_type === "activity" ? "brand" : "neutral"}>{labels[item.item_type]}</StatusPill></div><p className="mt-1 text-xs text-muted-foreground">{time || "Bez přesného času"}</p>{place?<p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--brand-highlight)]"><MapPin className="size-3.5"/>{place.name}{place.city?` · ${place.city}`:""}</p>:null}{item.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.notes}</p> : null}</div></div>
    {canEdit ? <div className="mt-4 flex flex-wrap gap-2"><Move dayId={dayId} direction="up" disabled={index===0} itemId={item.id} tripId={tripId}/><Move dayId={dayId} direction="down" disabled={index===total-1} itemId={item.id} tripId={tripId}/></div> : null}
    {canEdit && targetDays.length > 0 ? <MoveToDay dayId={dayId} itemId={item.id} targetDays={targetDays} tripId={tripId}/> : null}
    {canEdit ? <details className="mt-3 rounded-xl border border-border bg-background/25 p-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"><Pencil className="size-4 text-primary"/> Upravit bod</summary><form action={updateItineraryItem} className="mt-4 grid gap-4 sm:grid-cols-2"><Ids dayId={dayId} itemId={item.id} tripId={tripId}/><Fields item={item} places={places}/><Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">Uložit bod</Button></form><div className="mt-4 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Odstranění tohoto bodu je trvalé.</p><form action={removeItineraryItem} className="mt-2"><Ids dayId={dayId} itemId={item.id} tripId={tripId}/><Button type="submit" variant="destructive"><Trash2/> Ano, odstranit bod</Button></form></div></details> : null}
  </li>;
}

function MoveToDay({ dayId, itemId, targetDays, tripId }: { dayId:string; itemId:string; targetDays:ItineraryDayRow[]; tripId:string }) {
  return <details className="mt-3 min-w-0 rounded-xl border border-border bg-background/25 p-3">
    <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-medium"><ArrowRight className="size-4 shrink-0 text-primary"/> Přesunout do jiného dne</summary>
    <form action={moveItineraryItemToDay} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <Ids dayId={dayId} itemId={itemId} tripId={tripId}/>
      <label className="min-w-0 text-xs font-medium text-muted-foreground">Cílový den
        <select className={`${control} min-w-0`} name="targetDayId" required>
          {targetDays.map((day) => <option key={day.id} value={day.id}>{formatDayOption(day)}</option>)}
        </select>
      </label>
      <Button type="submit" variant="outline" className="w-full sm:w-auto"><ArrowRight/> Přesunout</Button>
    </form>
  </details>;
}

function Move({ dayId, direction, disabled, itemId, tripId }: { dayId:string; direction:"up"|"down"; disabled:boolean; itemId:string; tripId:string }) { const Icon=direction==="up"?ArrowUp:ArrowDown; return <form action={moveItineraryItem}><Ids dayId={dayId} itemId={itemId} tripId={tripId}/><input type="hidden" name="direction" value={direction}/><Button type="submit" variant="outline" size="sm" disabled={disabled}><Icon/>{direction==="up"?"Nahoru":"Dolů"}</Button></form>; }
function Ids({ dayId, itemId, tripId }: { dayId:string; itemId?:string; tripId:string }) { return <><input type="hidden" name="tripId" value={tripId}/><input type="hidden" name="dayId" value={dayId}/>{itemId?<input type="hidden" name="itemId" value={itemId}/>:null}</>; }
function Fields({ item, places }: { item?:ItineraryItemRow; places:TripPlaceRow[] }) { return <><label className="text-xs font-medium text-muted-foreground">Typ<select className={control} name="type" defaultValue={item?.item_type??"activity"}>{(Object.keys(labels) as ItineraryItemType[]).map(type=><option key={type} value={type}>{labels[type]}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Název<input className={control} name="title" defaultValue={item?.title??""} maxLength={160} placeholder="Návštěva chrámu" required/></label><label className="text-xs font-medium text-muted-foreground sm:col-span-2">Uložené místo (volitelné)<select className={control} name="placeId" defaultValue={item?.place_id??""}><option value="">Bez propojeného místa</option>{places.map(place=><option key={place.id} value={place.id}>{place.name}{place.city?` · ${place.city}`:""}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Začátek (volitelný)<input className={control} type="time" name="startTime" defaultValue={formatTime(item?.start_time)}/></label><label className="text-xs font-medium text-muted-foreground">Konec (volitelný)<input className={control} type="time" name="endTime" defaultValue={formatTime(item?.end_time)}/></label><label className="text-xs font-medium text-muted-foreground sm:col-span-2">Poznámka<textarea className={`${control} h-24 py-3`} name="notes" defaultValue={item?.notes??""} maxLength={1200} placeholder="Praktické informace, adresa nebo připomínka"/></label></>; }
function formatTime(value:string|null|undefined) { return value?.slice(0,5) ?? ""; }

function compareDays(left: ItineraryDayRow, right: ItineraryDayRow) {
  if (left.day_date && right.day_date) return left.day_date.localeCompare(right.day_date) || left.name.localeCompare(right.name, "cs");
  if (left.day_date) return -1;
  if (right.day_date) return 1;
  return (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.name.localeCompare(right.name, "cs");
}

function formatDayOption(day: ItineraryDayRow) {
  if (!day.day_date) return `Plán bez data · ${day.name}`;
  const date = dayDateFormatter.format(new Date(`${day.day_date}T00:00:00Z`));
  return `${date} · ${day.name}`;
}
