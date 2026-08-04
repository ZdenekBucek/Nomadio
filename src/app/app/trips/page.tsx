import {
  Archive,
  ArrowRight,
  CalendarDays,
  Clock3,
  LockKeyhole,
  MapPin,
  Plane,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { getAuthenticatedProfile } from "@/features/auth/session";
import { continentLabels, countryFlag, countryOptions } from "@/features/trips/countries";
import { TripForm } from "@/features/trips/trip-form";
import {
  formatTripDates,
  memberCountLabel,
  memberRoleLabel,
  travelerCountLabel,
  tripCoverClasses,
  tripStatusTone,
} from "@/features/trips/trip-presentation";
import { TravelerStack } from "@/features/trips/traveler-stack";
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
  TripDestinationRow,
  TripMemberRow,
  TripTravelerRow,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type TripsPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
    filter?: string;
  }>;
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
  let members: TripMemberRow[] = [];
  let travelers: TripTravelerRow[] = [];
  let destinationsError: { message: string } | null = null;
  let membersError: { message: string } | null = null;
  let travelersError: { message: string } | null = null;

  if (trips?.length) {
    const tripIds = trips.map((trip) => trip.id);
    const [destinationResult, travelerResult, memberResult] = await Promise.all([
      supabase
        .from("trip_destinations")
        .select("*")
        .in("trip_id", tripIds)
        .order("sort_order", { ascending: true }),
      supabase
        .from("trip_travelers")
        .select("*")
        .in("trip_id", tripIds)
        .order("sort_order", { ascending: true }),
      supabase
        .from("trip_members")
        .select("*")
        .in("trip_id", tripIds)
        .order("created_at", { ascending: true }),
    ]);
    destinations = destinationResult.data ?? [];
    destinationsError = destinationResult.error;
    travelers = travelerResult.data ?? [];
    travelersError = travelerResult.error;
    members = memberResult.data ?? [];
    membersError = memberResult.error;
  }

  const items: TripListItem[] = (trips ?? []).map((trip) => ({
    destinations: destinations.filter((destination) => destination.trip_id === trip.id),
    members: members.filter((member) => member.trip_id === trip.id),
    trip,
    travelers: travelers.filter((traveler) => traveler.trip_id === trip.id),
  }));
  const visibleItems = items.filter((item) => matchesTripFilter(item, activeFilter));
  const message = params.error
    ? errorMessages[params.error as keyof typeof errorMessages] ?? errorMessages.create
    : null;
  const loadError = tripsError ?? destinationsError ?? travelersError ?? membersError;

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
                <TripCard
                  key={item.trip.id}
                  currentUserId={auth.id}
                  item={item}
                />
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

function TripCard({
  currentUserId,
  item,
}: {
  currentUserId: string;
  item: TripListItem;
}) {
  const { trip } = item;
  const currentMembership = item.members.find((member) => member.user_id === currentUserId);
  const isOwner = currentMembership?.role === "owner";
  const isShared = item.members.length > 1;
  const primaryDestination =
    item.destinations.find((destination) => destination.is_primary) ?? item.destinations[0];
  const status = getEffectiveTripStatus(trip);
  const destination = primaryDestination
    ? [primaryDestination.city, primaryDestination.country_name].filter(Boolean).join(", ")
    : "Destinace bude doplněna";
  const additionalDestinations = Math.max(item.destinations.length - 1, 0);
  const dates = formatTripDates(trip.start_date, trip.end_date);
  const duration = tripDurationLabel(trip);
  const flag = countryFlag(primaryDestination?.country_code ?? null);
  const coverClass = tripCoverClasses[trip.cover_variant] ?? tripCoverClasses.violet;

  return (
    <Surface
      depth="panel"
      className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-primary/30"
    >
      <Link
        href={`/app/trips/${trip.id}`}
        className="block rounded-[1.5rem] outline-none focus-visible:ring-3 focus-visible:ring-primary/45"
        aria-label={`Otevřít cestu ${trip.name}`}
      >
        <div className={cn("relative h-36 overflow-hidden border-b border-border", coverClass)}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,7,18,0.72))]" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <StatusPill tone={tripStatusTone(status)}>{tripStatusLabels[status]}</StatusPill>
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
        <div className="mt-4 flex items-center justify-between gap-3">
          <TravelerStack travelers={item.travelers} />
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            {travelerCountLabel(item.travelers.length)}
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {isShared ? (
              <Share2 className="size-3.5" aria-hidden="true" />
            ) : (
              <LockKeyhole className="size-3.5" aria-hidden="true" />
            )}
            {isShared ? `Sdílená · ${memberCountLabel(item.members.length)}` : "Soukromá"}
            {currentMembership && !isOwner ? ` · ${memberRoleLabel(currentMembership.role)}` : ""}
          </span>
          <span className="flex items-center gap-1 text-[var(--brand-highlight)] transition group-hover:translate-x-0.5">
            Otevřít cestu <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
        </div>
      </Link>
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

function isTripFilter(value: string | undefined): value is TripFilter {
  return filters.some((filter) => filter.value === value);
}
