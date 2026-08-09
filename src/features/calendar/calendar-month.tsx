import { useMemo, type CSSProperties } from "react";
import { BedDouble, ChevronLeft, ChevronRight, CircleDollarSign, Plane } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatBudgetMoney } from "@/features/budget/budget-model";
import { cn } from "@/lib/utils";
import {
  buildMonthCalendar,
  dateKey,
  formatCalendarDateRange,
  monthLabel,
  monthStart,
  shiftMonth,
  type CalendarTrip,
  type MonthCalendarWeek,
  type MonthEvent,
  type MonthTripSegment,
} from "./calendar-model";
import styles from "./calendar-month.module.css";

const weekdays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const sevenColumns = "repeat(7, minmax(0, 1fr))";

export function CalendarMonth({
  events,
  month,
  onMonthChange,
  today,
  trips,
}: {
  events: MonthEvent[];
  month: Date;
  onMonthChange: (month: Date) => void;
  today: string;
  trips: CalendarTrip[];
}) {
  const calendar = useMemo(() => buildMonthCalendar(month, trips), [month, trips]);
  const eventsByDate = useMemo(() => events.reduce((groups, event) => {
    const dayEvents = groups.get(event.date) ?? [];
    dayEvents.push(event);
    groups.set(event.date, dayEvents);
    return groups;
  }, new Map<string, MonthEvent[]>()), [events]);
  const currentMonth = month.getUTCMonth();
  const hasTrips = calendar.weeks.some((week) => week.segments.length || week.hiddenSegments.length);
  const monthGridStyle = { "--week-count": calendar.weeks.length } as CSSProperties;

  return (
    <section aria-label={`Měsíc ${monthLabel(month)}`} className={styles.calendarMonth}>
      <MonthToolbar
        hasTrips={hasTrips}
        month={month}
        onMonthChange={onMonthChange}
      />
      <div className={styles.surface}>
        <WeekdayHeader />
        <div
          className={styles.monthGrid}
          data-testid="calendar-month-grid"
          data-week-count={calendar.weeks.length}
          style={monthGridStyle}
        >
          {calendar.weeks.map((week, weekIndex) => (
            <WeekRow
              currentMonth={currentMonth}
              eventsByDate={eventsByDate}
              key={dateKey(week.days[0]!)}
              today={today}
              week={week}
              weekIndex={weekIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MonthToolbar({
  hasTrips,
  month,
  onMonthChange,
}: {
  hasTrips: boolean;
  month: Date;
  onMonthChange: (month: Date) => void;
}) {
  return (
    <div className={styles.toolbar}>
      <div>
        <h2 className={styles.title}>{monthLabel(month)}</h2>
        {!hasTrips ? (
          <p className={styles.emptyState}>V tomto měsíci nemáte naplánovanou cestu.</p>
        ) : null}
      </div>
      <div className={styles.controls}>
        <Button
          aria-label="Předchozí měsíc"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          size="icon"
          variant="outline"
        >
          <ChevronLeft />
        </Button>
        <Button onClick={() => onMonthChange(monthStart(new Date()))} size="sm" variant="outline">
          Dnes
        </Button>
        <Button
          aria-label="Další měsíc"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          size="icon"
          variant="outline"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function WeekdayHeader() {
  return (
    <div
      aria-label="Dny v týdnu"
      className={styles.weekdayHeader}
      data-calendar-columns="7"
      role="row"
      style={{ gridTemplateColumns: sevenColumns }}
    >
      {weekdays.map((day, index) => (
        <div
          className={cn(styles.weekday, index > 4 && styles.weekendHeader)}
          data-weekday={day}
          key={day}
          role="columnheader"
        >
          {day}
        </div>
      ))}
    </div>
  );
}

function WeekRow({
  currentMonth,
  eventsByDate,
  today,
  week,
  weekIndex,
}: {
  currentMonth: number;
  eventsByDate: Map<string, MonthEvent[]>;
  today: string;
  week: MonthCalendarWeek;
  weekIndex: number;
}) {
  return (
    <div className={styles.weekRow} data-testid="calendar-week-row" data-week-index={weekIndex}>
      <div
        className={styles.dayGrid}
        data-calendar-columns="7"
        style={{ gridTemplateColumns: sevenColumns }}
      >
        {week.days.map((day, columnIndex) => {
          const key = dateKey(day);
          return (
            <div
              className={cn(styles.dayCell, columnIndex > 4 && styles.weekendCell)}
              data-calendar-day={key}
              key={key}
            >
              <span
                className={cn(
                  styles.dayNumber,
                  day.getUTCMonth() !== currentMonth && styles.outsideMonth,
                  key === today && styles.today,
                )}
              >
                {day.getUTCDate()}
              </span>
              <MonthDayEvents date={key} events={eventsByDate.get(key) ?? []} tripLanes={week.visibleLanes} />
            </div>
          );
        })}
      </div>
      <div
        className={styles.eventGrid}
        data-calendar-event-grid="true"
        data-calendar-columns="7"
        style={{ gridTemplateColumns: sevenColumns }}
      >
        {week.segments.map((segment) => (
          <TripBar key={`${segment.tripId}-${segment.weekIndex}`} segment={segment} />
        ))}
        {week.hiddenSegments.length ? (
          <OverflowTrips segments={week.hiddenSegments} />
        ) : null}
      </div>
    </div>
  );
}

const monthEventIcons = {
  accommodation_check_in: BedDouble,
  accommodation_check_out: BedDouble,
  payment: CircleDollarSign,
  transport: Plane,
} as const;

function MonthDayEvents({ date, events, tripLanes }: { date: string; events: MonthEvent[]; tripLanes: number }) {
  if (!events.length) return null;
  const desktopLimit = tripLanes >= 3 ? 0 : tripLanes === 2 ? 1 : 2;
  const mobileLimit = tripLanes >= 2 ? 0 : 1;
  const tooltipId = `calendar-month-events-${date}`;
  return (
    <div
      className={styles.monthEvents}
      data-month-events="true"
      style={{
        "--trip-offset": `${tripLanes * 1.65}rem`,
        "--trip-offset-mobile": `${tripLanes}rem`,
      } as CSSProperties}
    >
      <div className={styles.desktopEvents} data-month-event-layout="desktop" data-visible-limit={desktopLimit}>
        {events.slice(0, desktopLimit).map((event) => <MonthEventLink describedBy={tooltipId} event={event} key={event.id} />)}
        {events.length > desktopLimit ? <OverflowTrigger count={events.length - desktopLimit} describedBy={tooltipId} /> : null}
      </div>
      <div className={styles.mobileEvents} data-month-event-layout="mobile" data-visible-limit={mobileLimit}>
        {events.slice(0, mobileLimit).map((event) => <MonthEventLink compact describedBy={tooltipId} event={event} key={event.id} />)}
        {events.length > mobileLimit ? <OverflowTrigger compact count={events.length - mobileLimit} describedBy={tooltipId} /> : null}
      </div>
      <DayEventsPopover date={date} events={events} id={tooltipId} />
    </div>
  );
}

function OverflowTrigger({ compact = false, count, describedBy }: { compact?: boolean; count: number; describedBy: string }) {
  return <button aria-describedby={describedBy} aria-label={`Zobrazit ${count} dalších událostí`} className={styles.moreEvents} data-compact={compact} type="button">+{count}{compact ? "" : " další"}</button>;
}

function compactEventTitle(title: string) {
  const normalized = title.replace(/^(Doplatek|Check-in|Check-out)\s+/i, "").trim();
  return normalized.split(/\s+/)[0] ?? normalized;
}

function compactMoney(amount: number, currency: string) {
  if (Math.abs(amount) < 1000) return formatBudgetMoney(amount, currency);
  return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(amount / 1000)}k`;
}

function MonthEventLink({ compact = false, describedBy, event }: { compact?: boolean; describedBy: string; event: MonthEvent }) {
  const Icon = monthEventIcons[event.type];
  const amount = event.amount !== null && event.currency ? formatBudgetMoney(event.amount, event.currency) : null;
  const displayedAmount = compact && event.amount !== null && event.currency ? compactMoney(event.amount, event.currency) : amount;
  const tooltip = [event.title, event.subtitle, amount].filter(Boolean).join("\n");
  return (
    <Link
      aria-label={[event.title, amount].filter(Boolean).join(", ")}
      aria-describedby={describedBy}
      className={cn(styles.monthEvent, styles[`event_${event.type}`])}
      data-month-event-type={event.type}
      href={event.href}
      title={tooltip}
    >
      <Icon aria-hidden="true" className={styles.monthEventIcon} />
      <span>{compactEventTitle(event.title)}</span>
      {displayedAmount ? <span className={styles.monthEventAmount}>{displayedAmount}</span> : null}
    </Link>
  );
}

function DayEventsPopover({ date, events, id }: { date: string; events: MonthEvent[]; id: string }) {
  const label = new Intl.DateTimeFormat("cs-CZ", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return (
    <div aria-label={`Události ${label}`} className={styles.dayEventsPopover} id={id} role="dialog">
      <p className={styles.popoverDate}>{label}</p>
      <div className={styles.popoverList}>
        {events.map((event) => <MonthEventDetailLink event={event} key={`detail-${event.id}`} />)}
      </div>
    </div>
  );
}

function MonthEventDetailLink({ event }: { event: MonthEvent }) {
  const Icon = monthEventIcons[event.type];
  const amount = event.amount !== null && event.currency ? formatBudgetMoney(event.amount, event.currency) : null;
  return (
    <Link className={styles.popoverEvent} href={event.href}>
      <span className={cn(styles.popoverIcon, styles[`event_${event.type}`])}><Icon aria-hidden="true" /></span>
      <span className={styles.popoverCopy}><strong>{event.title}</strong><small>{event.subtitle}</small></span>
      {amount ? <span className={styles.popoverAmount}>{amount}</span> : null}
    </Link>
  );
}

function TripBar({ segment }: { segment: MonthTripSegment }) {
  return (
    <Link
      aria-label={`${segment.tripName}, ${formatCalendarDateRange(segment.trip.start_date!, segment.trip.end_date!)}`}
      className={cn(
        styles.tripBar,
        styles[segment.colorVariant],
        !segment.continuesBefore && styles.startsHere,
        !segment.continuesAfter && styles.endsHere,
      )}
      data-continues-after={segment.continuesAfter}
      data-continues-before={segment.continuesBefore}
      data-end-column={segment.endColumn}
      data-lane={segment.lane}
      data-start-column={segment.startColumn}
      href={segment.href}
      style={{
        gridColumn: `${segment.startColumn} / ${segment.endColumn + 1}`,
        gridRow: segment.lane + 1,
      }}
      title={`${segment.tripName}\n${formatCalendarDateRange(segment.trip.start_date!, segment.trip.end_date!)}`}
    >
      {segment.tripName}
    </Link>
  );
}

function OverflowTrips({ segments }: { segments: MonthTripSegment[] }) {
  return (
    <details
      className={styles.overflowDetails}
      style={{ gridColumn: "1 / 8", gridRow: 4 }}
    >
      <summary className={styles.overflowSummary}>+{segments.length} další</summary>
      <div className={styles.overflowPopover}>
        {segments.map((segment) => (
          <Link className={styles.overflowLink} href={segment.href} key={segment.tripId}>
            {segment.tripName}
          </Link>
        ))}
      </div>
    </details>
  );
}
