import { CalendarDays, MapPin, Plane, Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { getAuthenticatedProfile } from "@/features/auth/session";
import { TripForm } from "@/features/trips/trip-form";
import type { TripRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type TripsPageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
};

const errorMessages = {
  create: "Cestu se nepodařilo vytvořit. Zkuste to prosím znovu.",
  dates: "Datum návratu nesmí být před datem odjezdu.",
  invalid: "Zkontrolujte název, datum a třípísmenný kód měny.",
} as const;

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const [auth, params, supabase] = await Promise.all([
    getAuthenticatedProfile(),
    searchParams,
    createClient(),
  ]);

  if (!auth) {
    redirect("/login?next=/app/trips");
  }

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const message = params.error
    ? errorMessages[params.error as keyof typeof errorMessages] ?? errorMessages.create
    : null;

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
            Cesty
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Moje cesty
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Vlastní i sdílené cesty najdete bezpečně na jednom místě.
          </p>
        </div>
        <StatusPill tone="brand">{trips?.length ?? 0} cest</StatusPill>
      </header>

      {params.created ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-300">
          Cesta byla vytvořena jako soukromá.
        </div>
      ) : null}
      {message || error ? (
        <div role="alert" className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {message ?? "Cesty se nepodařilo načíst. Zkuste stránku obnovit."}
        </div>
      ) : null}

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <section aria-labelledby="trip-list-title">
          <h2 id="trip-list-title" className="sr-only">Seznam cest</h2>
          {trips?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
          ) : (
            <Surface depth="panel" className="grid min-h-80 place-items-center p-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
                  <Plane className="size-6" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-semibold">Vaše první dobrodružství</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Vytvořte první soukromou cestu. Sdílení přidáme v dalším bezpečném řezu.
                </p>
              </div>
            </Surface>
          )}
        </section>

        <TripForm defaultCurrency={auth.profile.defaultCurrency} />
      </div>
    </div>
  );
}

function TripCard({ trip }: { trip: TripRow }) {
  const destination = [...trip.cities, ...trip.countries].join(", ") || "Destinace bude doplněna";
  const dates = formatDates(trip.start_date, trip.end_date);

  return (
    <Surface depth="panel" className="group overflow-hidden p-0 transition hover:border-primary/30">
      <div className="h-28 border-b border-border bg-[radial-gradient(circle_at_75%_20%,rgba(123,97,255,0.3),transparent_45%),linear-gradient(135deg,#111a2c,#080d18)]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-[-0.025em]">{trip.name}</h3>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {dates}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              <span className="truncate">{destination}</span>
            </p>
          </div>
          <StatusPill tone="success">Soukromá</StatusPill>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{trip.currency}</span>
          <span className="flex items-center gap-1 opacity-45">
            Detail připravujeme <Plus className="size-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Surface>
  );
}

function formatDates(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "Termín bude doplněn";

  const formatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const format = (date: string) => formatter.format(new Date(`${date}T00:00:00Z`));

  if (startDate && endDate) return `${format(startDate)} – ${format(endDate)}`;
  return startDate ? `Od ${format(startDate)}` : `Do ${format(endDate!)}`;
}
