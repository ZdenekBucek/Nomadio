import { Archive, CalendarDays, ChevronLeft, Eye, MapPin, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { DayPlaceAdder } from "@/features/itinerary/day-place-adder";
import { DayTimeline } from "@/features/itinerary/day-timeline";
import { getItineraryDay, getItineraryDays, getTripPlaces } from "@/features/itinerary/itinerary-data";
import { DayMap } from "@/features/places/day-map";
import { createDayMapModel } from "@/features/places/day-map-view-model";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { cn } from "@/lib/utils";

type Props={params:Promise<{tripId:string;dayId:string}>;searchParams:Promise<{item?:string}>};
const messages={created:"Bod byl přidán.",updated:"Bod byl upraven.",moved:"Pořadí timeline bylo změněno.","moved-to-day":"Bod byl přesunut do jiného dne.",removed:"Bod byl odstraněn.",boundary:"Bod už je na kraji timeline.","place-added":"Místo bylo přidáno do dne.","place-invalid":"Zkontrolujte vybrané místo, čas a poznámku.","place-error":"Místo se nepodařilo přidat do dne.",invalid:"Zkontrolujte vyplněné údaje.",error:"Změnu se nepodařilo uložit."} as const;
const statusLabels={plan:"Plán",confirmed:"Potvrzeno",completed:"Dokončeno"} as const;

export default async function DayPage({params,searchParams}:Props){
  const [{tripId,dayId},query]=await Promise.all([params,searchParams]);
  const [detail,timeline,days,places]=await Promise.all([getTripDetail(tripId),getItineraryDay(dayId),getItineraryDays(tripId),getTripPlaces(tripId)]);
  if(!detail||!timeline||timeline.day.trip_id!==tripId) notFound();
  const role=detail.members.find(member=>member.user_id===detail.currentUserId)?.role??"viewer";
  const archived=detail.trip.status==="archived"; const canEdit=(role==="owner"||role==="editor")&&!archived;
  const message=query.item?messages[query.item as keyof typeof messages]??messages.error:null; const success=["created","updated","moved","moved-to-day","removed","place-added"].includes(query.item??"");
  const date=timeline.day.day_date?new Intl.DateTimeFormat("cs-CZ",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${timeline.day.day_date}T00:00:00Z`)):"Plán bez data";
  const mapModel=createDayMapModel(timeline.items,places);
  return <div>
    <Link href={`/app/trips/${tripId}/itinerary`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4"/> Zpět na itinerář</Link>
    <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{timeline.day.name}</h1><div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span className="flex items-center gap-2 capitalize"><CalendarDays className="size-4 text-primary"/>{date}</span>{timeline.day.city?<span className="flex items-center gap-2"><MapPin className="size-4 text-primary"/>{timeline.day.city}</span>:null}</div></div><div className="flex flex-wrap gap-2"><StatusPill tone={timeline.day.status==="completed"?"success":timeline.day.status==="confirmed"?"brand":"neutral"}>{statusLabels[timeline.day.status]}</StatusPill>{timeline.day.is_reserve?<StatusPill tone="warning"><Shield className="size-3"/>Rezervní</StatusPill>:null}<StatusPill>{memberRoleLabel(role)}</StatusPill></div></header>
    {archived?<Notice icon={<Archive className="size-4"/>}>Cesta je archivovaná. Timeline je pouze pro čtení.</Notice>:!canEdit?<Notice icon={<Eye className="size-4"/>}>Máte přístup pouze pro čtení. Body můžete prohlížet, ale ne měnit.</Notice>:null}
    {message?<div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm",success?"border-emerald-400/20 bg-emerald-400/8 text-emerald-300":"border-amber-400/20 bg-amber-400/8 text-amber-200")}>{message}</div>:null}
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)]">
      <Surface depth="panel" className="p-4 sm:p-6"><div className="mb-5"><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Program dne</p><h2 className="mt-2 text-xl font-semibold">Timeline</h2><p className="mt-1 text-sm text-muted-foreground">Aktivity, přesuny a poznámky v plánovaném pořadí.</p></div>{canEdit?<div className="mb-4"><DayPlaceAdder configured={Boolean(process.env.GEOAPIFY_API_KEY?.trim())} dayId={dayId} mapAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()||null} tripId={tripId}/></div>:null}<DayTimeline canEdit={canEdit} dayId={dayId} days={days} items={timeline.items} places={places} tripId={tripId}/></Surface>
      <div className="xl:sticky xl:top-6"><DayMap accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()||null} model={mapModel}/></div>
    </div>
  </div>;
}
function Notice({children,icon}:{children:React.ReactNode;icon:React.ReactNode}){return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 text-primary">{icon}</span><p>{children}</p></div>}
