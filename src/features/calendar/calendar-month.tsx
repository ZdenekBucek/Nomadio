import { useMemo, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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
  type MonthTripSegment,
} from "./calendar-model";
import styles from "./calendar-month.module.css";

const weekdays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const sevenColumns = "repeat(7, minmax(0, 1fr))";

export function CalendarMonth({
  month,
  onMonthChange,
  today,
  trips,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  today: string;
  trips: CalendarTrip[];
}) {
  const calendar = useMemo(() => buildMonthCalendar(month, trips), [month, trips]);
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
  today,
  week,
  weekIndex,
}: {
  currentMonth: number;
  today: string;
  week: MonthCalendarWeek;
  weekIndex: number;
}) {
  return (
    <div className={styles.weekRow} data-testid="calendar-week-row" data-week-index={weekIndex}>
      <div
        aria-hidden="true"
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
