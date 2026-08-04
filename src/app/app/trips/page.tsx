import {
  Archive,
  CalendarDays,
  Clock3,
  LockKeyhole,
  MapPin,
  Plane,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { getAuthenticatedProfile } from "@/features/auth/session";
import { continentLabels, countryFlag, countryOptions } from "@/features/trips/countries";
import { TripForm } from "@/features/trips/trip-form";
import {
  getEffectiveTripStatus,
  matchesTripFilter,
  tripDurationLabel,
  tripStatusLabels,
  tripTimingLabel,
  type TripFilter,
  type TripListItem,
} from "@/features/trips/trip-view";
import type {
  TripCoverVariant,
  TripDestinationRow,
  TripStatus,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type TripsPageProps = {
  searchParams: Promise<{ created?: string; error?: string; filter?: string }>;
};

const errorMessages = {
  create: "Cestu se nepodařilo vytvořit. Zkuste to prosím znovu.",
  dates: "Datum návratu nesmí být před datem odjezdu.",
  invalid: "Zkontrolujte povinné údaje a zadaná data.",
} as const;

const filters: { label: string; value: TripFilter }[] = [
  { label: "Nadcházející", value: "upcoming" },
  { label: "Probíhající", value: "active" },
  { label: "Dokončené", value: "completed" },
  { label: "Všechny", value: "all" },
  { label: "Archiv", value: "archive" },
];

const coverClasses: Record<TripCoverVariant, string> = {
  forest:
    "bg-[radial-gradient(circle_at_72%_16%,rgba(74,222,128,0.34),transparent_38%),radial-gradient(circle_at_20%_80%,rgba(14,116,144,0.38),transparent_44%),linear-gradient(135deg,#10251e,#080d18)]",
  ocean:
    "bg-[radial-gradient(circle_at_76%_18%,rgba(56,189,248,0.4),transparent_40%),radial-gradient(circle_at_18%_76%,rgba(99,102,241,0.4),transparent_44%),linear-gradient(135deg,#0d2138,#080d18)]",
  sunset:
    "bg-[radial-gradient(circle_at_78%_18%,rgba(251,146,60,0.46),transparent_38%),radial-gradient(circle_at_22%_80%,rgba(168,85,247,0.36),transparent_42%),linear-gradient(135deg,#23162a,#090d19)]",
  violet:
    "bg-[radial-gradient(circle_at_75%_20%,rgba(123,97,255,0.48),transparent_42%),radial-gradient(circle_at_18%_82%,rgba(168,85,247,0.24),transparent_44%),linear-gradient(135deg,#111a2c,#080d18)]",
};

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const [auth, params, supabase] = await Promise.all([
    getAuthenticatedProfile(),
    searchParams,
    createClient(),
  ]);

  if (!auth) {
    redirect("/login?next=/app/trips");
  }

  const activeFilter = isTripFilter(params.filter) ? params.filter : "upcoming";
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  let destinations: TripDestinationRow[] = [];
  let destinationsError: { message: string } | null = null;

  if (trips?.length) {
    const result = await supabase
      .from("trip_destinations")
      .select("*")
      .in(
        "trip_id",
        trips.map((trip) => trip.id),
      )
      .order("sort_order", { ascending: true });
    destinations = result.data ?? [];
    destinationsError = result.error;
  }

  const items: TripListItem[] = (trips ?? []).map((trip) => ({
    destinations: destinations.filter((destination) => destination.trip_id === trip.id),
    trip,
  }));
  const visibleItems = items.filter((item) => matchesTripFilter(item, activeFilter));
  const message = params.error
    ? errorMessages[params.error as keyof typeof errorMessages] ?? errorMessages.create
    : null;
  const loadError = tripsError ?? destinationsError;

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
        <StatusPill tone="brand">{items.length} cest</StatusPill>
      </header>

      {params.created ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-300">
          Cesta byla vytvořena jako soukromá.
        </div>
      ) : null}
      {message || loadError ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive"
        >
          {message ?? "Cesty se nepodařilo načíst. Zkuste stránku obnovit."}
        </div>
      ) : null}

      <nav aria-label="Filtr cest" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={`/app/trips?filter=${filter.value}`}
            aria-current={activeFilter === filter.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm transition",
              activeFilter === filter.value
                ? "border-primary/35 bg-primary/14 text-[var(--brand-highlight)]"
                : "border-border bg-card/45 text-muted-foreground hover:border-primary/25 hover:text-foreground",
            )}
          >
            {filter.value === "archive" ? <Archive className="size-3.5" aria-hidden="true" /> : null}
            {filter.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <section aria-labelledby="trip-list-title">
          <h2 id="trip-list-title" className="sr-only">
            Seznam cest
          </h2>
          {visibleItems.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleItems.map((item) => (
                <TripCard key={item.trip.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyTrips hasTrips={items.length > 0} filter={activeFilter} />
          )}
        </section>

        <TripForm
          countries={countryOptions}
          defaultCurrency={auth.profile.defaultCurrency}
          defaultTimezone={auth.profile.timezone}
        />
      </div>
    </div>
  );
}

function TripCard({ item }: { item: TripListItem }) {
  const { trip } = item;
  const primaryDestination =
    item.destinations.find((destination) => destination.is_primary) ?? item.destinations[0];
  const status = getEffectiveTripStatus(trip);
  const destination = primaryDestination
    ? [primaryDestination.city, primaryDestination.country_name].filter(Boolean).join(", ")
    : "Destinace bude doplněna";
  const additionalDestinations = Math.max(item.destinations.length - 1, 0);
  const dates = formatDates(trip.start_date, trip.end_date);
  const duration = tripDurationLabel(trip);
  const flag = countryFlag(primaryDestination?.country_code ?? null);
  const coverClass = coverClasses[trip.cover_variant] ?? coverClasses.violet;

  return (
    <Surface
      depth="panel"
      className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div className={cn("relative h-36 overflow-hidden border-b border-border", coverClass)}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,7,18,0.72))]" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <StatusPill tone={statusTone(status)}>{tripStatusLabels[status]}</StatusPill>
          <StatusPill className="border-white/10 bg-black/25 text-white/85 backdrop-blur-md">
            <Clock3 className="size-3" aria-hidden="true" />
            {tripTimingLabel(trip)}
          </StatusPill>
        </div>
        <span className="absolute right-4 bottom-3 text-4xl drop-shadow-lg" aria-hidden="true">
          {flag || "✦"}
        </span>
      </div>
      <div className="p-5">
        <h3 className="truncate text-lg font-semibold tracking-[-0.025em]">
          {trip.name} {flag ? <span aria-hidden="true">{flag}</span> : null}
        </h3>
        {trip.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {trip.description}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{dates}</span>
            {duration ? <span className="text-foreground/55">• {duration}</span> : null}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{destination}</span>
            {additionalDestinations ? (
              <span className="shrink-0 text-[var(--brand-highlight)]">+{additionalDestinations}</span>
            ) : null}
          </p>
          {primaryDestination?.continent ? (
            <p className="pl-5.5 text-foreground/50">
              {continentLabels[primaryDestination.continent]}
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            Soukromá · {trip.currency}
          </span>
          <span className="flex items-center gap-1 opacity-45">
            Detail připravujeme <Plus className="size-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Surface>
  );
}

function EmptyTrips({ filter, hasTrips }: { filter: TripFilter; hasTrips: boolean }) {
  return (
    <Surface depth="panel" className="grid min-h-80 place-items-center p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
          {filter === "archive" ? (
            <Archive className="size-6" aria-hidden="true" />
          ) : (
            <Plane className="size-6" aria-hidden="true" />
          )}
        </span>
        <h2 className="mt-5 text-xl font-semibold">
          {hasTrips ? "V této kategorii zatím nic není" : "Vaše první dobrodružství"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hasTrips
            ? "Vyberte jiný filtr nebo vytvořte novou cestu pomocí průvodce."
            : "Vytvořte první soukromou cestu. Sdílení přidáme v dalším bezpečném řezu."}
        </p>
      </div>
    </Surface>
  );
}

function statusTone(status: TripStatus): "brand" | "neutral" | "success" | "warning" {
  if (status === "active" || status === "ready") return "success";
  if (status === "planning") return "brand";
  if (status === "idea") return "warning";
  return "neutral";
}

function isTripFilter(value: string | undefined): value is TripFilter {
  return filters.some((filter) => filter.value === value);
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
