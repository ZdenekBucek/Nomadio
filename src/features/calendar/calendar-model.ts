import type { AccommodationRow, TaskRow, TripRow } from "@/lib/supabase/database.types";
import type { BudgetPaymentItem } from "@/features/budget/budget-domain";
import { formatDateOnly, formatDateOnlyLong, todayInTimeZone } from "@/lib/date-time";

function utcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export type CalendarEventType =
  | "trip_start"
  | "trip_end"
  | "accommodation_check_in"
  | "accommodation_check_out"
  | "transport"
  | "payment"
  | "task";

export type CalendarAgendaItem = {
  amount: number | null;
  currency: string | null;
  date: string;
  href: string;
  id: string;
  isOverdue: boolean;
  startTime: string | null;
  subtitle: string | null;
  title: string;
  tripId: string;
  tripName: string;
  type: CalendarEventType;
};

export type CalendarTrip = Pick<TripRow, "end_date" | "id" | "name" | "start_date"> & { timezone?: string };

export const calendarEventTypeMeta: Record<CalendarEventType, { label: string; filter: CalendarEventFilter }> = {
  accommodation_check_in: { label: "Check-in", filter: "accommodation" },
  accommodation_check_out: { label: "Check-out", filter: "accommodation" },
  payment: { label: "Platba", filter: "payment" },
  task: { label: "Úkol", filter: "task" },
  transport: { label: "Doprava", filter: "transport" },
  trip_end: { label: "Konec cesty", filter: "trip" },
  trip_start: { label: "Začátek cesty", filter: "trip" },
};

export type CalendarEventFilter = "all" | "trip" | "transport" | "accommodation" | "payment" | "task";

export type CalendarTransportEvent = {
  date: string;
  href: string;
  id: string;
  startTime: string | null;
  subtitle: string | null;
  title: string;
  tripId: string;
};

export type CalendarPaymentEvent = {
  amount: number;
  currency: string;
  date: string;
  href: string;
  id: string;
  title: string;
  tripId: string;
};

export type MonthEventType = Extract<
  CalendarEventType,
  "accommodation_check_in" | "accommodation_check_out" | "payment" | "transport"
>;

export type MonthEvent = Omit<Pick<
  CalendarAgendaItem,
  "amount" | "currency" | "date" | "href" | "id" | "subtitle" | "title" | "tripId" | "type"
>, "type"> & { type: MonthEventType };

const monthEventTypes = new Set<CalendarEventType>([
  "accommodation_check_in",
  "accommodation_check_out",
  "payment",
  "transport",
]);

export function calendarMonthEvents(items: CalendarAgendaItem[]): MonthEvent[] {
  return items
    .filter((item): item is CalendarAgendaItem & { type: MonthEventType } => monthEventTypes.has(item.type))
    .map(({ amount, currency, date, href, id, subtitle, title, tripId, type }) => ({
      amount,
      currency,
      date,
      href,
      id,
      subtitle,
      title,
      tripId,
      type,
    }));
}

export function calendarPaymentEvents(items: BudgetPaymentItem[]): CalendarPaymentEvent[] {
  return items.flatMap((item) => {
    if (
      (item.sourceType !== "accommodation" && item.sourceType !== "transport")
      || !item.dueDate
      || item.remainingAmount === null
      || item.remainingAmount <= 0
    ) return [];
    return [{
      amount: item.remainingAmount,
      currency: item.currency,
      date: item.dueDate,
      href: `/app/trips/${item.tripId}/${item.sourceType}`,
      id: `payment:${item.id}`,
      title: `Doplatek ${item.title}`,
      tripId: item.tripId,
    }];
  });
}

export type CalendarAgendaSources = {
  accommodations: AccommodationRow[];
  payments: CalendarPaymentEvent[];
  tasks: TaskRow[];
  transports: CalendarTransportEvent[];
  trips: CalendarTrip[];
};

export function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function formatCalendarDate(value: string) {
  return formatDateOnlyLong(value);
}

export function formatCalendarDateRange(start: string, end: string) {
  return `${formatDateOnly(start)} – ${formatDateOnly(end)}`;
}

export function monthLabel(month: Date) {
  return new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(month)
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export function shiftMonth(month: Date, offset: number) {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1));
}

export function monthWeeks(month: Date) {
  const start = monthStart(month);
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setUTCDate(start.getUTCDate() - mondayOffset);
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const weekCount = Math.ceil((mondayOffset + daysInMonth) / 7);
  return Array.from({ length: weekCount }, (_, week) => Array.from({ length: 7 }, (_, day) => {
    const result = new Date(gridStart);
    result.setUTCDate(gridStart.getUTCDate() + week * 7 + day);
    return result;
  }));
}

export type TripColorVariant = "violet" | "blue" | "teal" | "rose" | "amber";

export function tripColorVariant(tripId: string): TripColorVariant {
  let hash = 0;
  for (const character of tripId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return ["violet", "blue", "teal", "rose", "amber"][hash % 5]! as TripColorVariant;
}

export function tripColorClass(tripId: string) {
  return tripColorVariant(tripId);
}

export type WeekTripSegment = { endColumn: number; startColumn: number; trip: CalendarTrip };

export function weekTripSegments(week: Date[], trips: CalendarTrip[]) {
  const weekStart = dateKey(week[0]!);
  const weekEnd = dateKey(week[6]!);
  return trips
    .filter((trip) => trip.start_date && trip.end_date && trip.start_date <= weekEnd && trip.end_date >= weekStart)
    .map((trip) => {
      const tripEnd = trip.end_date!;
      const tripStart = trip.start_date!;
      return {
        endColumn: Math.min(7, Math.max(1, Math.round((utcDate(tripEnd < weekEnd ? tripEnd : weekEnd).valueOf() - utcDate(weekStart).valueOf()) / 86_400_000) + 1)),
        startColumn: Math.min(7, Math.max(1, Math.round((utcDate(tripStart > weekStart ? tripStart : weekStart).valueOf() - utcDate(weekStart).valueOf()) / 86_400_000) + 1)),
        trip,
      };
    })
    .sort((left, right) => left.startColumn - right.startColumn || left.trip.name.localeCompare(right.trip.name, "cs"));
}

export type MonthTripSegment = WeekTripSegment & {
  colorVariant: TripColorVariant;
  continuesAfter: boolean;
  continuesBefore: boolean;
  href: string;
  lane: number;
  tripId: string;
  tripName: string;
  weekIndex: number;
};

export type MonthCalendarWeek = {
  days: Date[];
  hiddenSegments: MonthTripSegment[];
  segments: MonthTripSegment[];
  visibleLanes: number;
};

export type MonthCalendar = { weeks: MonthCalendarWeek[] };

export function buildMonthCalendar(month: Date, trips: CalendarTrip[], maxVisibleLanes = 3): MonthCalendar {
  const weeks = monthWeeks(month).map((days, weekIndex) => {
    const weekStart = dateKey(days[0]!);
    const weekEnd = dateKey(days[6]!);
    const lanes: number[] = [];
    const segments = weekTripSegments(days, trips).map((segment) => {
      let lane = lanes.findIndex((lastEnd) => lastEnd < segment.startColumn);
      if (lane === -1) { lane = lanes.length; lanes.push(-1); }
      lanes[lane] = segment.endColumn;
      return {
        ...segment,
        colorVariant: tripColorVariant(segment.trip.id),
        continuesAfter: segment.trip.end_date! > weekEnd,
        continuesBefore: segment.trip.start_date! < weekStart,
        href: `/app/trips/${segment.trip.id}`,
        lane,
        tripId: segment.trip.id,
        tripName: segment.trip.name,
        weekIndex,
      };
    });
    return {
      days,
      hiddenSegments: segments.filter((segment) => segment.lane >= maxVisibleLanes),
      segments: segments.filter((segment) => segment.lane < maxVisibleLanes),
      visibleLanes: Math.min(maxVisibleLanes, Math.max(1, lanes.length)),
    };
  });
  return { weeks };
}

export function buildCalendarAgenda(sources: CalendarAgendaSources, today?: string | ((trip: CalendarTrip) => string), now = new Date()) {
  const trips = new Map(sources.trips.map((trip) => [trip.id, trip]));
  const todayResolver = today ?? ((trip: CalendarTrip) => todayInTimeZone(trip.timezone ?? "Europe/Prague", now));
  const events: CalendarAgendaItem[] = [];
  const add = (item: Omit<CalendarAgendaItem, "isOverdue">) => events.push({
    ...item,
    isOverdue: (item.type === "payment" || item.type === "task") && item.date < (typeof todayResolver === "function" ? todayResolver(trips.get(item.tripId) ?? { id: item.tripId, name: item.tripName, start_date: null, end_date: null }) : todayResolver),
  });

  for (const trip of sources.trips) {
    if (trip.start_date) add({ amount: null, currency: null, date: trip.start_date, href: `/app/trips/${trip.id}`, id: `trip-start:${trip.id}`, startTime: null, subtitle: trip.end_date ? formatCalendarDateRange(trip.start_date, trip.end_date) : null, title: `Začíná ${trip.name}`, tripId: trip.id, tripName: trip.name, type: "trip_start" });
    if (trip.end_date) add({ amount: null, currency: null, date: trip.end_date, href: `/app/trips/${trip.id}`, id: `trip-end:${trip.id}`, startTime: null, subtitle: null, title: `Končí ${trip.name}`, tripId: trip.id, tripName: trip.name, type: "trip_end" });
  }
  for (const item of sources.accommodations) {
    const trip = trips.get(item.trip_id); if (!trip) continue;
    const href = `/app/trips/${item.trip_id}/accommodation?edit=${item.id}`;
    add({ amount: null, currency: null, date: item.check_in_date, href, id: `check-in:${item.id}`, startTime: item.check_in_time?.slice(0, 5) ?? null, subtitle: trip.name, title: `Check-in ${item.name}`, tripId: trip.id, tripName: trip.name, type: "accommodation_check_in" });
    add({ amount: null, currency: null, date: item.check_out_date, href, id: `check-out:${item.id}`, startTime: item.check_out_time?.slice(0, 5) ?? null, subtitle: trip.name, title: `Check-out ${item.name}`, tripId: trip.id, tripName: trip.name, type: "accommodation_check_out" });
  }
  for (const item of sources.transports) {
    const trip = trips.get(item.tripId); if (!trip) continue;
    add({ amount: null, currency: null, date: item.date, href: item.href, id: `transport:${item.id}`, startTime: item.startTime, subtitle: item.subtitle ?? trip.name, title: item.title, tripId: trip.id, tripName: trip.name, type: "transport" });
  }
  for (const item of sources.payments) {
    const eventTrip = trips.get(item.tripId);
    if (!eventTrip) continue;
    add({ amount: item.amount, currency: item.currency, date: item.date, href: item.href, id: item.id, startTime: null, subtitle: eventTrip.name, title: item.title, tripId: eventTrip.id, tripName: eventTrip.name, type: "payment" });
  }
  for (const item of sources.tasks) {
    const trip = trips.get(item.trip_id); if (!trip || !item.due_date || item.status === "completed" || item.status === "cancelled") continue;
    add({ amount: null, currency: null, date: item.due_date, href: `/app/trips/${trip.id}/checklist`, id: `task:${item.id}`, startTime: null, subtitle: trip.name, title: item.title, tripId: trip.id, tripName: trip.name, type: "task" });
  }
  return events.sort((left, right) => left.date.localeCompare(right.date) || (left.startTime ?? "00:00").localeCompare(right.startTime ?? "00:00") || Number(right.isOverdue) - Number(left.isOverdue) || left.title.localeCompare(right.title, "cs"));
}

export function filterAgenda(items: CalendarAgendaItem[], tripId: string, type: CalendarEventFilter, includePast: boolean, today: string | ((item: CalendarAgendaItem) => string) = dateKey(new Date())) {
  return items.filter((item) => (tripId === "all" || item.tripId === tripId) && (type === "all" || calendarEventTypeMeta[item.type].filter === type) && (includePast || item.date >= (typeof today === "function" ? today(item) : today)));
}

export function groupAgendaByDate(items: CalendarAgendaItem[]) {
  return Array.from(items.reduce((groups, item) => {
    const group = groups.get(item.date) ?? []; group.push(item); groups.set(item.date, group); return groups;
  }, new Map<string, CalendarAgendaItem[]>()).entries());
}
