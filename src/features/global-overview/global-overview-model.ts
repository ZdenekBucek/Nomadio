import { accommodationCoverage } from "@/features/accommodation/accommodation-model";
import type { TripBudgetDashboard } from "@/features/budget/budget-dashboard-model";
import { summarizeBudgetAmounts, type BudgetPaymentItem } from "@/features/budget/budget-domain";
import { formatBudgetMoney } from "@/features/budget/budget-model";
import {
  summarizePacking,
  summarizeTasks,
  type ChecklistTask,
} from "@/features/checklist/checklist-model";
import {
  buildCalendarAgenda,
  dateKey,
  type CalendarAgendaItem,
  type CalendarAgendaSources,
  type CalendarTransportEvent,
} from "@/features/calendar/calendar-model";
import { documentSummary } from "@/features/documents/document-model";
import { getEffectiveTripStatus } from "@/features/trips/trip-view";
import type {
  AccommodationRow,
  DocumentRow,
  PackingItemRow,
  TripDestinationRow,
  TripRow,
  TripTravelerRow,
} from "@/lib/supabase/database.types";

export type OverviewDocument = Pick<DocumentRow, "id" | "is_important" | "name" | "offline_enabled" | "trip_id">;
export type GlobalAttention = {
  detail: string;
  href: string;
  id: string;
  severity: "high" | "medium";
  tripId: string;
  tripName: string;
  title: string;
  type: "accommodation" | "document" | "payment" | "task";
};

const DAY_MS = 86_400_000;
const eventPriority: Record<CalendarAgendaItem["type"], number> = {
  transport: 0,
  accommodation_check_in: 1,
  accommodation_check_out: 1,
  payment: 2,
  task: 3,
  trip_start: 4,
  trip_end: 5,
};

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

function daysInclusive(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS) + 1);
}

function selectNextEvent(events: CalendarAgendaItem[]) {
  if (!events.length) return null;
  const firstDate = events[0]!.date;
  return events
    .filter((event) => event.date === firstDate)
    .toSorted((left, right) => eventPriority[left.type] - eventPriority[right.type] || (left.startTime ?? "99:99").localeCompare(right.startTime ?? "99:99"))[0] ?? null;
}

function paymentHref(item: BudgetPaymentItem) {
  return item.sourceType === "accommodation" || item.sourceType === "transport"
    ? `/app/trips/${item.tripId}/${item.sourceType}?edit=${item.sourceId}`
    : `/app/trips/${item.tripId}/budget?tab=payments`;
}

export function buildGlobalOverview(input: {
  accommodations: AccommodationRow[];
  budgetDashboards: TripBudgetDashboard[];
  destinations: TripDestinationRow[];
  documents: OverviewDocument[];
  packingItems: PackingItemRow[];
  tasks: ChecklistTask[];
  transports: CalendarTransportEvent[];
  travelers: TripTravelerRow[];
  trips: TripRow[];
}, now = new Date()) {
  const today = dateKey(now);
  const destinations = input.destinations ?? [];
  const travelers = input.travelers ?? [];
  const tripById = new Map(input.trips.map((trip) => [trip.id, trip]));
  const activeTrips = input.trips.filter((trip) => getEffectiveTripStatus(trip, now) === "active");
  const upcomingTrips = input.trips.filter((trip) => {
    const status = getEffectiveTripStatus(trip, now);
    return status !== "archived" && status !== "completed" && Boolean(trip.start_date && trip.start_date >= today);
  }).toSorted((left, right) => (left.start_date ?? "9999-12-31").localeCompare(right.start_date ?? "9999-12-31"));
  const dominantTrip = activeTrips.toSorted((left, right) => (left.start_date ?? "").localeCompare(right.start_date ?? ""))[0] ?? upcomingTrips[0] ?? null;

  const payments = input.budgetDashboards.flatMap((dashboard) => [
    ...dashboard.payments.overduePayments,
    ...dashboard.payments.upcomingPayments,
  ]).toSorted((left, right) => {
    const leftOverdue = Boolean(left.dueDate && left.dueDate < today);
    const rightOverdue = Boolean(right.dueDate && right.dueDate < today);
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
    return (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31") || left.title.localeCompare(right.title, "cs") || left.id.localeCompare(right.id);
  });
  const agenda = [
    ...buildCalendarAgenda({ accommodations: input.accommodations, payments: [], tasks: input.tasks, transports: input.transports, trips: input.trips } satisfies CalendarAgendaSources, today),
    ...payments.flatMap((item): CalendarAgendaItem[] => {
      const trip = tripById.get(item.tripId);
      if (!trip || !item.dueDate || item.remainingAmount === null || item.remainingAmount <= 0) return [];
      return [{ amount: item.remainingAmount, currency: item.currency, date: item.dueDate, href: paymentHref(item), id: `payment:${item.id}`, isOverdue: item.dueDate < today, startTime: null, subtitle: trip.name, title: `Doplatit ${item.title}`, tripId: trip.id, tripName: trip.name, type: "payment" }];
    }),
  ].toSorted((left, right) => left.date.localeCompare(right.date) || (left.startTime ?? "00:00").localeCompare(right.startTime ?? "00:00") || eventPriority[left.type] - eventPriority[right.type] || left.title.localeCompare(right.title, "cs"));
  const financeReality = summarizeBudgetAmounts(input.budgetDashboards.flatMap((dashboard) => dashboard.reality.totalsByCurrency));
  const openTasks = input.tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").toSorted((left, right) => {
    const leftOverdue = Boolean(left.due_date && left.due_date < today);
    const rightOverdue = Boolean(right.due_date && right.due_date < today);
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
    if (left.priority !== right.priority) return left.priority === "high" ? -1 : right.priority === "high" ? 1 : 0;
    return (left.due_date ?? "9999-12-31").localeCompare(right.due_date ?? "9999-12-31");
  });

  const alerts: GlobalAttention[] = [];
  for (const payment of payments.filter((item) => item.dueDate && item.dueDate < today)) {
    const trip = tripById.get(payment.tripId);
    if (!trip) continue;
    alerts.push({ detail: `${formatBudgetMoney(payment.remainingAmount ?? 0, payment.currency)} bylo splatné ${payment.dueDate}.`, href: paymentHref(payment), id: `payment:${payment.id}`, severity: "high", tripId: trip.id, tripName: trip.name, title: payment.title, type: "payment" });
  }
  for (const trip of input.trips) {
    const coverage = accommodationCoverage(input.accommodations.filter((item) => item.trip_id === trip.id), trip.start_date, trip.end_date);
    if (coverage.gapNights) alerts.push({ detail: `Chybí ubytování na ${coverage.gapNights} ${coverage.gapNights === 1 ? "noc" : "noci"}.`, href: `/app/trips/${trip.id}/accommodation`, id: `gap:${trip.id}`, severity: "high", tripId: trip.id, tripName: trip.name, title: "Chybí ubytování", type: "accommodation" });
    if (coverage.overlapCount) alerts.push({ detail: `${coverage.overlapCount} překrývající se rezervace.`, href: `/app/trips/${trip.id}/accommodation`, id: `overlap:${trip.id}`, severity: "medium", tripId: trip.id, tripName: trip.name, title: "Překrývající se ubytování", type: "accommodation" });
  }
  for (const task of openTasks.filter((task) => task.due_date && task.due_date < today)) {
    const trip = tripById.get(task.trip_id);
    if (!trip) continue;
    alerts.push({ detail: `Termín ${task.due_date} už uplynul.`, href: `/app/trips/${trip.id}/checklist`, id: `task:${task.id}`, severity: "high", tripId: trip.id, tripName: trip.name, title: task.title, type: "task" });
  }
  for (const document of input.documents.filter((item) => item.is_important && !item.offline_enabled)) {
    const trip = tripById.get(document.trip_id);
    if (!trip) continue;
    alerts.push({ detail: "Důležitý dokument není označený pro offline použití.", href: `/app/trips/${trip.id}/documents/${document.id}`, id: `document:${document.id}`, severity: "medium", tripId: trip.id, tripName: trip.name, title: document.name, type: "document" });
  }

  const futureAgenda = agenda.filter((event) => event.date >= today);
  const nextEvent = selectNextEvent(futureAgenda);
  const dominantPreparation = dominantTrip ? (() => {
    const tripAccommodations = input.accommodations.filter((item) => item.trip_id === dominantTrip.id);
    const tripTasks = input.tasks.filter((item) => item.trip_id === dominantTrip.id);
    const tripDocuments = input.documents.filter((item) => item.trip_id === dominantTrip.id);
    const tripPacking = input.packingItems.filter((item) => item.trip_id === dominantTrip.id);
    const coverage = accommodationCoverage(tripAccommodations, dominantTrip.start_date, dominantTrip.end_date);
    const nights = Math.max(0, daysInclusive(dominantTrip.start_date, dominantTrip.end_date) - 1);
    const coveredNights = Math.max(0, nights - coverage.gapNights);
    const task = summarizeTasks(tripTasks);
    const document = documentSummary(tripDocuments);
    const documentTarget = document.important || document.total;
    const documentReady = document.important ? tripDocuments.filter((item) => item.is_important && item.offline_enabled).length : document.offline;
    return {
      accommodation: { complete: coveredNights, percent: percent(coveredNights, nights), total: nights },
      checklist: { complete: task.completed, percent: percent(task.completed, task.total), total: task.total },
      documents: { complete: documentReady, percent: percent(documentReady, documentTarget), total: documentTarget },
      packing: summarizePacking(tripPacking),
    };
  })() : null;
  const primaryDestination = dominantTrip ? destinations.find((item) => item.trip_id === dominantTrip.id && item.is_primary) ?? destinations.find((item) => item.trip_id === dominantTrip.id) ?? null : null;
  const dominantMeta = dominantTrip ? {
    countryCode: primaryDestination?.country_code ?? null,
    destination: primaryDestination ? [primaryDestination.city, primaryDestination.country_name].filter(Boolean).join(", ") : dominantTrip.cities?.[0] ?? dominantTrip.countries?.[0] ?? null,
    isActive: getEffectiveTripStatus(dominantTrip, now) === "active",
    dayNumber: dominantTrip.start_date ? Math.max(1, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dominantTrip.start_date}T00:00:00Z`)) / DAY_MS) + 1) : null,
    totalDays: daysInclusive(dominantTrip.start_date, dominantTrip.end_date),
    travelerCount: travelers.filter((item) => item.trip_id === dominantTrip.id).length,
  } : null;
  const visibleTasks = openTasks.slice(0, 3).flatMap((task) => {
    const trip = tripById.get(task.trip_id);
    return trip ? [{ ...task, href: `/app/trips/${trip.id}/checklist`, tripName: trip.name }] : [];
  });
  return {
    alerts: alerts.toSorted((left, right) => left.severity === right.severity ? 0 : left.severity === "high" ? -1 : 1).slice(0, 5),
    agenda,
    dominantMeta,
    dominantPreparation,
    dominantTrip,
    documents: documentSummary(input.documents),
    financeReality,
    nextEvent,
    openTasks: visibleTasks,
    payments: payments.slice(0, 3).map((item) => ({ ...item, href: paymentHref(item), isOverdue: Boolean(item.dueDate && item.dueDate < today), tripName: tripById.get(item.tripId)?.name ?? "Cesta" })),
    stats: { active: activeTrips.length, completed: input.trips.filter((trip) => getEffectiveTripStatus(trip, now) === "completed").length, upcoming: upcomingTrips.length },
    upcoming: futureAgenda.filter((event) => event.id !== nextEvent?.id).slice(0, 5),
  };
}

export type GlobalOverview = ReturnType<typeof buildGlobalOverview>;
export type { CalendarAgendaItem };
