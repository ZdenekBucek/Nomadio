import { Archive, CalendarRange, ChevronLeft, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { getItineraryDays, getTripPlaces } from "@/features/itinerary/itinerary-data";
import { ItineraryDays } from "@/features/itinerary/itinerary-days";
import { TripPlaces } from "@/features/itinerary/trip-places";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ tripId: string }>; searchParams: Promise<{ day?: string; place?: string }> };
const messages = { created: "Den byl přidán.", updated: "Den byl upraven.", moved: "Pořadí plánů bylo změněno.", removed: "Den byl odstraněn.", boundary: "Plán už je na kraji seznamu.", dated: "Datované dny se řadí automaticky podle data.", "date-taken": "Pro vybrané datum už jeden den existuje.", invalid: "Zkontrolujte vyplněné údaje.", error: "Změnu se nepodařilo uložit." } as const;

export default async function ItineraryPage({ params, searchParams }: Props) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const [detail, days, places] = await Promise.all([getTripDetail(tripId), getItineraryDays(tripId), getTripPlaces(tripId)]);
  if (!detail) notFound();
  const role = detail.members.find((member) => member.user_id === detail.currentUserId)?.role ?? "viewer";
  const archived = detail.trip.status === "archived";
  const canEdit = (role === "owner" || role === "editor") && !archived;
  const message = query.day ? messages[query.day as keyof typeof messages] ?? messages.error : null;
  const success = ["created", "updated", "moved", "removed"].includes(query.day ?? "");
  const placeMessages = { created:"Místo bylo uloženo.",updated:"Místo bylo upraveno.",removed:"Místo bylo odstraněno.","mapbox-saved":"Místo z Mapboxu bylo uloženo.","mapbox-invalid":"Vybraný výsledek není platný.","mapbox-error":"Místo z Mapboxu se nepodařilo uložit.","in-use":"Místo je propojené s timeline. Nejdřív ho od bodu odpojte.",coordinates:"Vyplňte obě souřadnice, nebo obě nechte prázdné.",invalid:"Zkontrolujte údaje místa.",error:"Změnu místa se nepodařilo uložit." } as const;
  const placeMessage=query.place?placeMessages[query.place as keyof typeof placeMessages]??placeMessages.error:null;
  const placeSuccess=["created","updated","removed","mapbox-saved"].includes(query.place??"");
  return <div>
    <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4"/> Zpět na přehled cesty</Link>
    <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><CalendarRange className="size-8 text-primary"/> Itinerář</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Připravte celé dny a přiřaďte je do kalendáře, až budete znát termín.</p></div><StatusPill tone={canEdit ? "brand" : "neutral"}>{memberRoleLabel(role)}</StatusPill></header>
    {archived ? <Notice icon={<Archive className="size-4"/>}>Cesta je archivovaná. Itinerář zůstává dostupný pouze pro čtení.</Notice> : !canEdit ? <Notice icon={<Eye className="size-4"/>}>Máte přístup pouze pro čtení. Dny můžete prohlížet, ale ne měnit.</Notice> : null}
    {message ? <div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", success ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-amber-400/20 bg-amber-400/8 text-amber-200")}>{message}</div> : null}
    {placeMessage ? <div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", placeSuccess ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-amber-400/20 bg-amber-400/8 text-amber-200")}>{placeMessage}</div> : null}
    <ItineraryDays canEdit={canEdit} days={days} tripId={tripId}/>
    <TripPlaces canEdit={canEdit} mapboxConfigured={Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim())} places={places} tripId={tripId}/>
  </div>;
}

function Notice({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) { return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 shrink-0 text-primary">{icon}</span><p>{children}</p></div>; }
