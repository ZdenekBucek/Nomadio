import {
  CalendarDays,
  ChevronLeft,
  Globe2,
  LockKeyhole,
  MapPin,
  Share2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { getSafeGoogleAvatarUrl } from "@/features/auth/profile";
import { shareTrip } from "@/features/trips/actions";
import { continentLabels, countryFlag } from "@/features/trips/countries";
import { getTripDetail } from "@/features/trips/trip-detail";
import {
  formatTripDates,
  memberCountLabel,
  memberRoleLabel,
  travelerCountLabel,
  travelerInitials,
  tripCoverClasses,
  tripStatusTone,
} from "@/features/trips/trip-presentation";
import { TravelerStack } from "@/features/trips/traveler-stack";
import {
  getEffectiveTripStatus,
  tripDurationLabel,
  tripStatusLabels,
  tripTimingLabel,
} from "@/features/trips/trip-view";
import { cn } from "@/lib/utils";

type TripOverviewPageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ share?: string }>;
};

const shareMessages = {
  added: "Přístup byl přidán. Uživateli se cesta zobrazí v Moje cesty.",
  "already-member": "Tento uživatel už má k cestě přístup.",
  error: "Přístup se nepodařilo přidat. Zkuste to prosím znovu.",
  invalid: "Zkontrolujte e-mail a zvolenou roli.",
  "user-not-found": "Účet s tímto e-mailem zatím v Nomadiu neexistuje.",
} as const;

export default async function TripOverviewPage({
  params,
  searchParams,
}: TripOverviewPageProps) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const detail = await getTripDetail(tripId);

  if (!detail) notFound();

  const { destinations, members, travelers, trip } = detail;
  const currentMembership = members.find(
    (member) => member.user_id === detail.currentUserId,
  );
  const isOwner = currentMembership?.role === "owner";
  const isShared = members.length > 1;
  const primaryDestination =
    destinations.find((destination) => destination.is_primary) ?? destinations[0];
  const status = getEffectiveTripStatus(trip);
  const flag = countryFlag(primaryDestination?.country_code ?? null);
  const destination = primaryDestination
    ? [primaryDestination.city, primaryDestination.country_name].filter(Boolean).join(", ")
    : "Destinace bude doplněna";
  const shareMessage = query.share
    ? shareMessages[query.share as keyof typeof shareMessages] ?? shareMessages.error
    : null;

  return (
    <div>
      <Link
        href="/app/trips"
        className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground lg:hidden"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Moje cesty
      </Link>

      <header
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border border-border px-5 py-6 shadow-[0_28px_100px_-45px_rgba(0,0,0,0.95)] sm:px-7 sm:py-8 lg:px-9",
          tripCoverClasses[trip.cover_variant],
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.92),rgba(3,7,18,0.48)_65%,rgba(3,7,18,0.24))]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={tripStatusTone(status)}>
                {tripStatusLabels[status]}
              </StatusPill>
              <StatusPill className="border-white/10 bg-black/25 text-white/85 backdrop-blur-md">
                {tripTimingLabel(trip)}
              </StatusPill>
              <StatusPill className="border-white/10 bg-black/25 text-white/75 backdrop-blur-md">
                {status === "active" ? "Režim cesty" : "Režim plánování"}
              </StatusPill>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
              {trip.name} {flag ? <span aria-hidden="true">{flag}</span> : null}
            </h1>
            {trip.description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                {trip.description}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/72">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 text-[var(--brand-highlight)]" aria-hidden="true" />
                {formatTripDates(trip.start_date, trip.end_date)}
                {tripDurationLabel(trip) ? ` · ${tripDurationLabel(trip)}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-[var(--brand-highlight)]" aria-hidden="true" />
                {destination}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
            <TravelerStack travelers={travelers} size="large" />
            <div>
              <p className="text-sm font-medium text-white">
                {travelerCountLabel(travelers.length)}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {isShared ? memberCountLabel(members.length) : "Soukromá cesta"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {shareMessage ? (
        <div
          role="status"
          className={cn(
            "mt-5 rounded-2xl border px-4 py-3 text-sm",
            query.share === "added"
              ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300"
              : "border-amber-400/20 bg-amber-400/8 text-amber-200",
          )}
        >
          {shareMessage}
        </div>
      ) : null}

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <div className="grid gap-5">
          <Surface depth="panel" className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
                  Přehled cesty
                </p>
                <h2 className="mt-2 text-xl font-semibold">Destinace</h2>
              </div>
              <StatusPill tone="neutral">{destinations.length}</StatusPill>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {destinations.length ? (
                destinations.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/22 p-4"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-xl">
                      {countryFlag(item.country_code) || <Globe2 className="size-5 text-primary" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {[item.city, item.country_name].filter(Boolean).join(", ") || "Bez názvu"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.is_primary ? "Hlavní destinace" : "Další destinace"}
                        {item.continent ? ` · ${continentLabels[item.continent]}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Destinace zatím není doplněná.</p>
              )}
            </div>
          </Surface>

          <Surface depth="panel" className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
                  Skupina
                </p>
                <h2 className="mt-2 text-xl font-semibold">Cestovatelé</h2>
              </div>
              <StatusPill tone="neutral">{travelerCountLabel(travelers.length)}</StatusPill>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {travelers.map((traveler) => {
                const avatarUrl = getSafeGoogleAvatarUrl(traveler.avatar_url);
                return (
                  <div
                    key={traveler.id}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/22 p-4"
                  >
                    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/14 text-xs font-semibold text-[var(--brand-highlight)]">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        travelerInitials(traveler.display_name)
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{traveler.display_name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserRound className="size-3" aria-hidden="true" />
                        {traveler.user_id ? "Účet Nomadio" : "Cestovatel bez účtu"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>
        </div>

        <Surface depth="panel" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
                Přístup
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {isShared ? "Sdílená cesta" : "Soukromá cesta"}
              </h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
              {isShared ? <Share2 className="size-5" aria-hidden="true" /> : <LockKeyhole className="size-5" aria-hidden="true" />}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 rounded-2xl border border-border bg-muted/22 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Vaše role</dt>
              <dd className="font-medium">
                {currentMembership ? memberRoleLabel(currentMembership.role) : "Člen"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Přístup má</dt>
              <dd className="font-medium">{memberCountLabel(members.length)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Měna cesty</dt>
              <dd className="font-medium">{trip.currency}</dd>
            </div>
          </dl>

          {isOwner ? (
            <form action={shareTrip} className="mt-5 grid gap-3 border-t border-border pt-5">
              <input type="hidden" name="tripId" value={trip.id} />
              <label className="text-xs font-medium text-muted-foreground">
                Přesný e-mail uživatele
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15"
                  type="email"
                  name="email"
                  placeholder="uzivatel@example.com"
                  autoComplete="email"
                  maxLength={320}
                  required
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Oprávnění
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15"
                  name="role"
                  defaultValue="viewer"
                >
                  <option value="viewer">Viewer · pouze čtení</option>
                  <option value="editor">Editor · může upravovat</option>
                </select>
              </label>
              <Button type="submit" size="lg" className="mt-1 w-full">
                <ShieldCheck aria-hidden="true" /> Přidat přístup
              </Button>
              <p className="text-[0.68rem] leading-5 text-muted-foreground">
                E-mail neposíláme. Uživatel musí mít existující účet v Nomadiu.
              </p>
            </form>
          ) : (
            <p className="mt-5 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              <Users className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Přístupy ke sdílené cestě spravuje její vlastník.
            </p>
          )}
        </Surface>
      </div>
    </div>
  );
}
