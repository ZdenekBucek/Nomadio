"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "@daypicker/react";
import { cs } from "@daypicker/react/locale";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { calendarDateToDateOnly, dateOnlyToCalendarDate, formatDateOnly } from "@/lib/date-time";
import { cn } from "@/lib/utils";

import { useDesktopPickerPresentation } from "./picker-presentation";

type DatePickerProps = {
  className?: string;
  clearable?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  label: string;
  name: string;
  placeholder?: string;
};

function DateCalendar({ onChange, value }: { onChange: (value: string | null) => void; value: string | null }) {
  return (
    <DayPicker
      animate
      className="nomadio-date-picker"
      defaultMonth={dateOnlyToCalendarDate(value) ?? new Date()}
      fixedWeeks
      locale={cs}
      mode="single"
      onSelect={(selection) => onChange(selection ? calendarDateToDateOnly(selection) : null)}
      selected={dateOnlyToCalendarDate(value) ?? undefined}
      showOutsideDays
      weekStartsOn={1}
    />
  );
}

function PickerPanel({
  clearable,
  onCancel,
  onChange,
  onConfirm,
  title,
  value,
}: {
  clearable: boolean;
  onCancel: () => void;
  onChange: (value: string | null) => void;
  onConfirm: () => void;
  title: string;
  value: string | null;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button className="max-sm:size-10" type="button" variant="ghost" size="icon-sm" onClick={onCancel} aria-label={`Zavřít ${title.toLocaleLowerCase("cs-CZ")}`}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <DateCalendar value={value} onChange={onChange} />
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Vybrané datum</p>
        <p className="mt-1 font-medium">{formatDateOnly(value)}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        {clearable ? <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>Vymazat</Button> : <span />}
        <Button type="button" size="sm" onClick={onConfirm}>Potvrdit</Button>
      </div>
    </div>
  );
}

/** A date-only picker which submits only the canonical YYYY-MM-DD value. */
export function DatePicker({
  className,
  clearable = true,
  defaultValue = null,
  disabled = false,
  label,
  name,
  placeholder = "Vyberte datum",
}: DatePickerProps) {
  const initialValue = dateOnlyToCalendarDate(defaultValue) ? defaultValue ?? null : null;
  const [committedValue, setCommittedValue] = useState(initialValue);
  const [draftValue, setDraftValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useDesktopPickerPresentation();

  function beginSelection() {
    setDraftValue(committedValue);
    setOpen(true);
  }

  function cancelSelection() {
    setDraftValue(committedValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function confirmSelection() {
    setCommittedValue(draftValue);
    setOpen(false);
  }

  const trigger = (
    <>
      <CalendarDays className="size-4 shrink-0 text-[var(--brand-highlight)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">{committedValue ? formatDateOnly(committedValue) : placeholder}</span>
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
      <input type="hidden" name={name} value={committedValue ?? ""} disabled={disabled} />
      {isDesktop ? (
        <Popover.Root open={open} onOpenChange={(nextOpen) => (nextOpen ? beginSelection() : cancelSelection())}>
          <Popover.Trigger ref={triggerRef} type="button" disabled={disabled} className={triggerClassName} aria-label={label}>{trigger}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={12} className="z-50">
              <Popover.Popup aria-label={label} className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)] outline-none">
                <PickerPanel clearable={clearable} title={label} value={draftValue} onChange={setDraftValue} onCancel={cancelSelection} onConfirm={confirmSelection} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <Dialog.Root open={open} onOpenChange={(nextOpen) => (nextOpen ? beginSelection() : cancelSelection())}>
          <Dialog.Trigger ref={triggerRef} type="button" disabled={disabled} className={triggerClassName} aria-label={label}>{trigger}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
            <Dialog.Viewport className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
              <Dialog.Popup className="pointer-events-auto max-h-[min(42rem,calc(100dvh-1rem))] w-full overflow-y-auto rounded-t-[1.75rem] border border-border bg-sidebar p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-foreground shadow-[0_-24px_70px_-30px_rgba(0,0,0,0.95)] outline-none data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                <Dialog.Title className="sr-only">{label}</Dialog.Title>
                <Dialog.Description className="sr-only">Vyberte datum v kalendáři.</Dialog.Description>
                <PickerPanel clearable={clearable} title={label} value={draftValue} onChange={setDraftValue} onCancel={cancelSelection} onConfirm={confirmSelection} />
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
