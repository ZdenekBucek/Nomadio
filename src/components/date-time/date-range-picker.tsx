"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import { DayPicker, type DateRange } from "@daypicker/react";
import { cs } from "@daypicker/react/locale";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  calendarDateToDateOnly,
  dateOnlyToCalendarDate,
  formatDateOnly,
} from "@/lib/date-time";
import { cn } from "@/lib/utils";

import { useDesktopPickerPresentation } from "./picker-presentation";

type CanonicalDateRange = {
  endDate: string | null;
  startDate: string | null;
};

type DateRangePickerProps = {
  className?: string;
  defaultEndDate?: string | null;
  defaultStartDate?: string | null;
  disabled?: boolean;
  endName: string;
  label?: string;
  startName: string;
};

function normalizedRange(startDate?: string | null, endDate?: string | null): CanonicalDateRange {
  return {
    endDate: dateOnlyToCalendarDate(endDate) ? endDate ?? null : null,
    startDate: dateOnlyToCalendarDate(startDate) ? startDate ?? null : null,
  };
}

function selectedRange(range: CanonicalDateRange): DateRange | undefined {
  const from = dateOnlyToCalendarDate(range.startDate);
  const to = dateOnlyToCalendarDate(range.endDate);
  return from ? { from, to: to ?? undefined } : undefined;
}

function displayRange(range: CanonicalDateRange) {
  if (range.startDate && range.endDate) {
    return `${formatDateOnly(range.startDate)} → ${formatDateOnly(range.endDate)}`;
  }

  if (range.startDate) return `Od ${formatDateOnly(range.startDate)}`;
  if (range.endDate) return `Do ${formatDateOnly(range.endDate)}`;
  return "Vyberte termín cesty";
}

function SelectionSummary({ range }: { range: CanonicalDateRange }) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Od</p>
        <p className="mt-1 font-medium">{formatDateOnly(range.startDate)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Do</p>
        <p className="mt-1 font-medium">{formatDateOnly(range.endDate)}</p>
      </div>
    </div>
  );
}

function RangeCalendar({ onChange, range }: { onChange: (range: CanonicalDateRange) => void; range: CanonicalDateRange }) {
  return (
    <DayPicker
      animate
      className="nomadio-date-picker"
      defaultMonth={dateOnlyToCalendarDate(range.startDate) ?? dateOnlyToCalendarDate(range.endDate) ?? new Date()}
      fixedWeeks
      locale={cs}
      mode="range"
      onSelect={(selection) => {
        onChange({
          endDate: selection?.to ? calendarDateToDateOnly(selection.to) : null,
          startDate: selection?.from ? calendarDateToDateOnly(selection.from) : null,
        });
      }}
      resetOnSelect
      selected={selectedRange(range)}
      showOutsideDays
      weekStartsOn={1}
    />
  );
}

function PickerPanel({
  onCancel,
  onChange,
  onConfirm,
  range,
  title,
}: {
  onCancel: () => void;
  onChange: (range: CanonicalDateRange) => void;
  onConfirm: () => void;
  range: CanonicalDateRange;
  title: string;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button className="max-sm:size-10" type="button" variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Zavřít výběr termínu">
          <X aria-hidden="true" />
        </Button>
      </div>
      <RangeCalendar range={range} onChange={onChange} />
      <SelectionSummary range={range} />
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ endDate: null, startDate: null })}>
          Vymazat
        </Button>
        <Button type="button" size="sm" onClick={onConfirm}>
          Potvrdit
        </Button>
      </div>
    </div>
  );
}

/**
 * A date-only range picker that preserves the existing FormData field names.
 * It intentionally keeps localized labels out of the submitted values.
 */
export function DateRangePicker({
  className,
  defaultEndDate = null,
  defaultStartDate = null,
  disabled = false,
  endName,
  label = "Termín cesty",
  startName,
}: DateRangePickerProps) {
  const initialRange = normalizedRange(defaultStartDate, defaultEndDate);
  const [committedRange, setCommittedRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useDesktopPickerPresentation();

  function beginSelection() {
    setDraftRange(committedRange);
    setOpen(true);
  }

  function cancelSelection() {
    setDraftRange(committedRange);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function confirmSelection() {
    setCommittedRange(draftRange);
    setOpen(false);
  }

  const trigger = (
    <>
      <CalendarDays className="size-4 shrink-0 text-[var(--brand-highlight)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">{displayRange(committedRange)}</span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" aria-hidden="true" />
    </>
  );

  const triggerClassName = cn(
    "group flex min-h-11 w-full items-center gap-2 rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition hover:border-primary/45 focus-visible:border-primary/55 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65",
    className,
  );

  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type="hidden" name={startName} value={committedRange.startDate ?? ""} disabled={disabled} />
      <input type="hidden" name={endName} value={committedRange.endDate ?? ""} disabled={disabled} />

      {isDesktop ? (
        <Popover.Root
          open={open}
          onOpenChange={(nextOpen) => (nextOpen ? beginSelection() : cancelSelection())}
        >
          <Popover.Trigger ref={triggerRef} type="button" disabled={disabled} className={triggerClassName} aria-label={label}>
            {trigger}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={12} className="z-50">
              <Popover.Popup aria-label={label} className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)] outline-none">
                <PickerPanel title={label} range={draftRange} onChange={setDraftRange} onCancel={cancelSelection} onConfirm={confirmSelection} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <Dialog.Root open={open} onOpenChange={(nextOpen) => (nextOpen ? beginSelection() : cancelSelection())}>
          <Dialog.Trigger ref={triggerRef} type="button" disabled={disabled} className={triggerClassName} aria-label={label}>
            {trigger}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
            <Dialog.Viewport className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
              <Dialog.Popup className="pointer-events-auto max-h-[min(42rem,calc(100dvh-1rem))] w-full overflow-y-auto rounded-t-[1.75rem] border border-border bg-sidebar p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-foreground shadow-[0_-24px_70px_-30px_rgba(0,0,0,0.95)] outline-none data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                <Dialog.Title className="sr-only">{label}</Dialog.Title>
                <Dialog.Description className="sr-only">Vyberte datum odjezdu a návratu.</Dialog.Description>
                <PickerPanel title={label} range={draftRange} onChange={setDraftRange} onCancel={cancelSelection} onConfirm={confirmSelection} />
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
