import type { TripDestinationRow, TripRow, TripStatus } from "@/lib/supabase/database.types";

export type TripFilter = "upcoming" | "active" | "completed" | "all" | "archive";

export type TripListItem = {
  destinations: TripDestinationRow[];
  trip: TripRow;
};

export const tripStatusLabels: Record<TripStatus, string> = {
  active: "Probíhá",
  archived: "Archivováno",
  completed: "Dokončeno",
  idea: "Nápad",
  planning: "Plánování",
  ready: "Připraveno",
};

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getEffectiveTripStatus(trip: TripRow, now = new Date()): TripStatus {
  if (trip.status === "archived" || trip.status === "completed") return trip.status;

  const today = dateOnly(now);
  if (trip.start_date && trip.end_date && trip.start_date <= today && trip.end_date >= today) {
    return "active";
  }
  if (trip.end_date && trip.end_date < today) return "completed";
  return trip.status;
}

export function matchesTripFilter(item: TripListItem, filter: TripFilter, now = new Date()) {
  const status = getEffectiveTripStatus(item.trip, now);
  if (filter === "all") return status !== "archived";
  if (filter === "archive") return status === "archived";
  if (filter === "active") return status === "active";
  if (filter === "completed") return status === "completed";
  return ["idea", "planning", "ready"].includes(status);
}

export function tripTimingLabel(trip: TripRow, now = new Date()) {
  const status = getEffectiveTripStatus(trip, now);
  if (status === "active") return "Právě cestujete";
  if (status === "completed") return "Cesta skončila";
  if (status === "archived") return "V archivu";
  if (!trip.start_date) return "Termín je otevřený";

  const today = new Date(`${dateOnly(now)}T00:00:00Z`);
  const start = new Date(`${trip.start_date}T00:00:00Z`);
  const days = Math.ceil((start.valueOf() - today.valueOf()) / 86_400_000);
  if (days <= 0) return "Začíná dnes";
  if (days === 1) return "Za 1 den";
  if (days >= 2 && days <= 4) return `Za ${days} dny`;
  return `Za ${days} dní`;
}

export function tripDurationLabel(trip: TripRow) {
  if (!trip.start_date || !trip.end_date) return null;
  const start = new Date(`${trip.start_date}T00:00:00Z`);
  const end = new Date(`${trip.end_date}T00:00:00Z`);
  const days = Math.round((end.valueOf() - start.valueOf()) / 86_400_000) + 1;
  return `${days} ${days === 1 ? "den" : days >= 2 && days <= 4 ? "dny" : "dní"}`;
}
