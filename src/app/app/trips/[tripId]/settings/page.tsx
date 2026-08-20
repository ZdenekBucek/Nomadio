import { Archive, ChevronLeft, Eye, Image as ImageIcon, MapPinned, Settings2, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/ui/status-pill";
import { getTripDetail } from "@/features/trips/trip-detail";
import { TripDestinations } from "@/features/trips/trip-destinations";
import { TripLifecyclePanel } from "@/features/trips/trip-lifecycle-panel";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { TripCoverSettings, TripSettingsForm } from "@/features/trips/trip-settings-form";
import { getTripCover } from "@/features/trips/trip-cover";
import { TripMembers } from "@/features/trips/trip-members";
import { TripQuickExpenseSettings } from "@/features/trips/trip-quick-expense-settings";
import { shareTrip } from "@/features/trips/actions";
import { TripSettingsSection } from "@/features/trips/trip-settings-section";
import { cn } from "@/lib/utils";

type TripSettingsPageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ cover?: string; destination?: string; lifecycle?: string; quickExpense?: string; settings?: string }>;
};

const destinationMessages = {
  added: "Destinace byla přidána.",
  updated: "Destinace byla upravena.",
  moved: "Pořadí destinací bylo změněno.",
  primary: "Hlavní destinace byla změněna.",
  removed: "Destinace byla odebrána.",
  boundary: "Destinace už je na kraji seznamu.",
  "no-change": "Tato destinace už je hlavní.",
  "last-destination": "Poslední destinaci nelze odebrat.",
  "primary-destination": "Nejdřív zvolte jinou hlavní destinaci.",
  invalid: "Zkontrolujte údaje destinace.",
  error: "Změnu destinace se nepodařilo uložit.",
} as const;

export default async function TripSettingsPage({ params, searchParams }: TripSettingsPageProps) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const detail = await getTripDetail(tripId);
  if (!detail) notFound();

  const membership = detail.members.find((member) => member.user_id === detail.currentUserId);
  const role = membership?.role ?? "viewer";
  const isArchived = detail.trip.status === "archived";
  const canEdit = (role === "owner" || role === "editor") && !isArchived;
  const destinationMessage = query.destination
    ? destinationMessages[query.destination as keyof typeof destinationMessages] ?? destinationMessages.error
    : null;
  const success = ["added", "updated", "moved", "primary", "removed"].includes(query.destination ?? "");
  const cover = await getTripCover(detail.trip);
  const coverMessage = query.cover === "uploaded" ? "Obrázek cesty byl nahrán." : query.cover === "removed" ? "Obrázek cesty byl odstraněn." : query.cover ? "Obrázek se nepodařilo změnit. Zkontrolujte formát a velikost souboru." : null;

  return (
    <div>
      <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden="true" /> Zpět na přehled cesty
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Nastavení cesty</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Upravte základní údaje, vzhled a pořadí destinací na jednom místě.</p>
        </div>
        <StatusPill tone={canEdit ? "brand" : "neutral"}>{memberRoleLabel(role)}</StatusPill>
      </header>

      {isArchived ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100"><Archive className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>Cesta je archivovaná. Veškerý obsah je pouze pro čtení; vlastník ji může níže obnovit.</p></div> : !canEdit ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><Eye className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><p>Máte přístup pouze pro čtení. Nastavení i destinace můžete prohlížet, ale ne měnit.</p></div> : null}
      {query.settings === "saved" ? <Feedback success>Základní nastavení bylo uloženo.</Feedback> : null}
      {query.quickExpense === "saved" ? <Feedback success>Nastavení rychlých výdajů bylo uloženo.</Feedback> : null}
      {query.quickExpense && query.quickExpense !== "saved" ? <Feedback success={false}>Nastavení rychlých výdajů se nepodařilo uložit.</Feedback> : null}
      {coverMessage ? <Feedback success={query.cover === "uploaded" || query.cover === "removed"}>{coverMessage}</Feedback> : null}
      {query.lifecycle === "error" ? <Feedback success={false}>Akci se nepodařilo provést. Ověřte stav cesty a zkuste to znovu.</Feedback> : null}
      {destinationMessage ? <Feedback success={success}>{destinationMessage}</Feedback> : null}

      <div className="mt-6 grid gap-4">
        <TripSettingsSection defaultOpen description="Název, termín, měna, stav a destinace cesty." icon={<Settings2 className="size-5" aria-hidden="true" />} id="trip-settings-basic" title="Základní informace">
          <div className="grid gap-5 pt-5">
            <TripSettingsForm canEdit={canEdit} cover={cover} includeCover={false} trip={detail.trip} />
            <TripQuickExpenseSettings
              canEdit={canEdit}
              enabled={detail.trip.quick_expense_before_start_enabled}
              globalEnabled={detail.userQuickExpenseFabEnabled}
              tripId={tripId}
            />
            <div className="border-t border-border pt-5">
              <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><MapPinned className="size-5" aria-hidden="true" /></span><div><h3 className="text-base font-semibold">Destinace</h3><p className="mt-1 text-sm text-muted-foreground">Hlavní místo a navazující zastávky v pořadí cesty.</p></div></div>
              <TripDestinations canEdit={canEdit} destinations={detail.destinations} tripId={tripId} />
            </div>
          </div>
        </TripSettingsSection>

        <TripSettingsSection defaultOpen={Boolean(query.cover)} description="Barevný motiv a vlastní obrázek cesty." icon={<ImageIcon className="size-5" aria-hidden="true" />} id="trip-settings-appearance" title="Vzhled cesty">
          <div className="pt-5"><TripCoverSettings canEdit={canEdit} cover={cover} trip={detail.trip} /></div>
        </TripSettingsSection>

        <TripSettingsSection description="Členové, role a přístup ke sdílené cestě." icon={<Share2 className="size-5" aria-hidden="true" />} id="trip-settings-sharing" title="Sdílení a členové">
          <div className="pt-5">
            <TripMembers currentUserId={detail.currentUserId} isOwner={role === "owner"} members={detail.members} tripId={tripId} />
            {role === "owner" ? <form action={shareTrip} className="mt-5 grid gap-3 border-t border-border pt-5">
              <input type="hidden" name="tripId" value={tripId} />
              <label className="text-xs font-medium text-muted-foreground">Přesný e-mail uživatele<input className="mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15" type="email" name="email" placeholder="uzivatel@example.com" autoComplete="email" maxLength={320} required /></label>
              <label className="text-xs font-medium text-muted-foreground">Oprávnění<select className="mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15" name="role" defaultValue="viewer"><option value="viewer">Viewer · pouze čtení</option><option value="editor">Editor · může upravovat</option></select></label>
              <button type="submit" className="min-h-11 w-full rounded-xl border border-primary/35 bg-primary/10 px-4 text-sm font-medium text-primary transition hover:bg-primary/15 sm:w-fit">Přidat člena</button>
            </form> : null}
          </div>
        </TripSettingsSection>

        {role === "owner" ? <TripSettingsSection defaultOpen={Boolean(query.lifecycle)} description="Archivace, obnovení nebo trvalé odstranění cesty." icon={<Archive className="size-5" aria-hidden="true" />} id="trip-settings-management" title="Správa cesty"><div className="pt-5"><TripLifecyclePanel archived={isArchived} tripId={tripId} tripName={detail.trip.name} /></div></TripSettingsSection> : null}
      </div>
    </div>
  );
}

function Feedback({ children, success }: { children: React.ReactNode; success: boolean }) {
  return <div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", success ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-amber-400/20 bg-amber-400/8 text-amber-200")}>{children}</div>;
}
