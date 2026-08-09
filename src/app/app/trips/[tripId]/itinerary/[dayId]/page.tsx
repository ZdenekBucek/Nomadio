import { Archive, CalendarDays, ChevronLeft, Eye, MapPin, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { DayItineraryWorkspace } from "@/features/itinerary/day-itinerary-workspace";
import { getItineraryDay, getItineraryDays, getTripPlaces } from "@/features/itinerary/itinerary-data";
import { createDayMapModel } from "@/features/places/day-map-view-model";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { cn } from "@/lib/utils";
import { formatDateOnlyLong } from "@/lib/date-time";

type Props={params:Promise<{tripId:string;dayId:string}>;searchParams:Promise<{item?:string;mapPlace?:string;mapPlaceId?:string}>};
const messages={created:"Bod byl přidán.",updated:"Bod byl upraven.",moved:"Pořadí timeline bylo změněno.","moved-to-day":"Bod byl přesunut do jiného dne.",removed:"Bod byl odstraněn.",boundary:"Bod už je na kraji timeline.","place-added":"Místo bylo přidáno do dne.","place-invalid":"Zkontrolujte vybrané místo, čas a poznámku.","place-error":"Místo se nepodařilo přidat do dne.",invalid:"Zkontrolujte vyplněné údaje.",error:"Změnu se nepodařilo uložit."} as const;
const statusLabels={plan:"Plán",confirmed:"Potvrzeno",completed:"Dokončeno"} as const;
const mapPlaceMessages={created:"Vlastní místo bylo uloženo.",continue:"Vlastní místo je připravené k přidání do programu.","day-added":"Vlastní místo bylo uloženo a přidáno do tohoto dne.",invalid:"Zkontrolujte název, kategorii a souřadnice místa.",error:"Vlastní místo se nepodařilo uložit."}as const;

export default async function DayPage({params,searchParams}:Props){
  const [{tripId,dayId},query]=await Promise.all([params,searchParams]);
  const [detail,timeline,days,places]=await Promise.all([getTripDetail(tripId),getItineraryDay(dayId),getItineraryDays(tripId),getTripPlaces(tripId)]);
  if(!detail||!timeline||timeline.day.trip_id!==tripId) notFound();
  const role=detail.members.find(member=>member.user_id===detail.currentUserId)?.role??"viewer";
  const archived=detail.trip.status==="archived"; const canEdit=(role==="owner"||role==="editor")&&!archived;
  const message=query.item?messages[query.item as keyof typeof messages]??messages.error:null; const success=["created","updated","moved","moved-to-day","removed","place-added"].includes(query.item??"");
  const mapPlaceMessage=query.mapPlace?mapPlaceMessages[query.mapPlace as keyof typeof mapPlaceMessages]??mapPlaceMessages.error:null;
  const date=timeline.day.day_date?formatDateOnlyLong(timeline.day.day_date):"Plán bez data";
  const mapModel=createDayMapModel(timeline.items,places);
  return <div>
    <Link href={`/app/trips/${tripId}/itinerary`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4"/> Zpět na itinerář</Link>
    <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{timeline.day.name}</h1><div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span className="flex items-center gap-2 capitalize"><CalendarDays className="size-4 text-primary"/>{date}</span>{timeline.day.city?<span className="flex items-center gap-2"><MapPin className="size-4 text-primary"/>{timeline.day.city}</span>:null}</div></div><div className="flex flex-wrap gap-2"><StatusPill tone={timeline.day.status==="completed"?"success":timeline.day.status==="confirmed"?"brand":"neutral"}>{statusLabels[timeline.day.status]}</StatusPill>{timeline.day.is_reserve?<StatusPill tone="warning"><Shield className="size-3"/>Rezervní</StatusPill>:null}<StatusPill>{memberRoleLabel(role)}</StatusPill></div></header>
    {archived?<Notice icon={<Archive className="size-4"/>}>Cesta je archivovaná. Timeline je pouze pro čtení.</Notice>:!canEdit?<Notice icon={<Eye className="size-4"/>}>Máte přístup pouze pro čtení. Body můžete prohlížet, ale ne měnit.</Notice>:null}
    {message?<div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm",success?"border-emerald-400/20 bg-emerald-400/8 text-emerald-300":"border-amber-400/20 bg-amber-400/8 text-amber-200")}>{message}</div>:null}
    {mapPlaceMessage?<div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm",["created","day-added"].includes(query.mapPlace??"")?"border-emerald-400/20 bg-emerald-400/8 text-emerald-300":"border-amber-400/20 bg-amber-400/8 text-amber-200")}>{mapPlaceMessage}</div>:null}
    <DayItineraryWorkspace canEdit={canEdit} dayId={dayId} days={days} geoapifyConfigured={Boolean(process.env.GEOAPIFY_API_KEY?.trim())} initialPlaceId={query.mapPlace === "continue" ? query.mapPlaceId ?? null : null} items={timeline.items} mapAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()||null} mapModel={mapModel} places={places} tripId={tripId}/>
  </div>;
}
function Notice({children,icon}:{children:React.ReactNode;icon:React.ReactNode}){return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 text-primary">{icon}</span><p>{children}</p></div>}
