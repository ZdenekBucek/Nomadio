"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "@daypicker/react";
import { cs } from "@daypicker/react/locale";
import { CalendarClock, ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { calendarDateToDateOnly, dateOnlyToCalendarDate, formatDateOnly, isValidDateTimeLocal, isValidTimeOnly } from "@/lib/date-time";
import { cn } from "@/lib/utils";

import { useDesktopPickerPresentation } from "./picker-presentation";

type LocalDateTime = { date: string | null; time: string | null };

type DateTimePickerProps = {
  className?: string;
  disabled?: boolean;
  error?: string | null;
  label: string;
  onChange: (value: string) => void;
  timeZone: string;
  value: string;
};

function splitValue(value: string): LocalDateTime {
  if (!isValidDateTimeLocal(value)) return { date: null, time: null };
  const [date, time] = value.split("T");
  return { date: date ?? null, time: time ?? null };
}

function joinValue(value: LocalDateTime) {
  return value.date && value.time && isValidTimeOnly(value.time) ? `${value.date}T${value.time}` : "";
}

function DateTimeCalendar({ onChange, value }: { onChange: (next: LocalDateTime) => void; value: LocalDateTime }) {
  return <DayPicker animate className="nomadio-date-picker" defaultMonth={dateOnlyToCalendarDate(value.date) ?? new Date()} fixedWeeks locale={cs} mode="single" onSelect={(selection) => onChange({ ...value, date: selection ? calendarDateToDateOnly(selection) : null })} selected={dateOnlyToCalendarDate(value.date) ?? undefined} showOutsideDays weekStartsOn={1} />;
}

function PickerPanel({ onCancel, onChange, onConfirm, timeZone, title, value }: {
  onCancel: () => void;
  onChange: (value: LocalDateTime) => void;
  onConfirm: () => void;
  timeZone: string;
  title: string;
  value: LocalDateTime;
}) {
  return <div className="grid gap-4">
    <div className="flex items-center justify-between gap-3"><h3 className="text-base font-semibold">{title}</h3><Button className="max-sm:size-10" type="button" variant="ghost" size="icon-sm" onClick={onCancel} aria-label={`Zavřít ${title.toLocaleLowerCase("cs-CZ")}`}><X aria-hidden="true" /></Button></div>
    <DateTimeCalendar value={value} onChange={onChange} />
    <label className="grid gap-2 text-xs font-medium text-muted-foreground">Čas
      <input className="h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15" type="time" step={60} value={value.time ?? ""} onChange={(event) => onChange({ ...value, time: event.target.value || null })} />
    </label>
    <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm"><p className="text-xs text-muted-foreground">Čas cesty</p><p className="mt-1 font-medium">{timeZone}</p>{value.date && value.time ? <p className="mt-2 text-xs text-muted-foreground">{formatDateOnly(value.date)} · {value.time}</p> : null}</div>
    <div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" size="sm" onClick={() => onChange({ date: null, time: null })}>Vymazat</Button><Button type="button" size="sm" onClick={onConfirm}>Potvrdit</Button></div>
  </div>;
}

/** Controlled local DateTimePicker. It intentionally never converts values to UTC. */
export function DateTimePicker({ className, disabled = false, error, label, onChange, timeZone, value }: DateTimePickerProps) {
  const [draftValue, setDraftValue] = useState<LocalDateTime>(splitValue(value));
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useDesktopPickerPresentation();
  const current = splitValue(value);
  const errorId = `${label.replace(/\s+/g, "-").toLocaleLowerCase("cs-CZ")}-error`;

  function beginSelection() { setDraftValue(current); setOpen(true); }
  function cancelSelection() { setDraftValue(current); setOpen(false); triggerRef.current?.focus(); }
  function confirmSelection() { onChange(joinValue(draftValue)); setOpen(false); }
  const display = current.date && current.time ? `${formatDateOnly(current.date)} · ${current.time}` : "Vyberte datum a čas";
  const trigger = <><CalendarClock className="size-4 shrink-0 text-[var(--brand-highlight)]" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-left">{display}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" aria-hidden="true" /></>;
  const triggerClassName = cn("group flex min-h-11 w-full items-center gap-2 rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition hover:border-primary/45 focus-visible:border-primary/55 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65", error && "border-amber-400/60", className);
  const panel = <PickerPanel title={label} value={draftValue} timeZone={timeZone} onChange={setDraftValue} onCancel={cancelSelection} onConfirm={confirmSelection} />;

  return <div className="grid gap-2"><span className="text-xs font-medium text-muted-foreground">{label}</span>
    {isDesktop ? <Popover.Root open={open} onOpenChange={(nextOpen) => nextOpen ? beginSelection() : cancelSelection()}><Popover.Trigger ref={triggerRef} type="button" disabled={disabled} className={triggerClassName} aria-label={label} aria-describedby={error ? errorId : undefined}>{trigger}</Popover.Trigger><Popover.Portal><Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={12} className="z-50"><Popover.Popup aria-label={label} className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)] outline-none">{panel}</Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root> : <Dialog.Root open={open} onOpenChange={(nextOpen) => nextOpen ? beginSelection() : cancelSelection()}><Dialog.Trigger ref={triggerRef} type="button" disabled={disabled} className={triggerClassName} aria-label={label} aria-describedby={error ? errorId : undefined}>{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" /><Dialog.Viewport className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center"><Dialog.Popup className="pointer-events-auto max-h-[min(42rem,calc(100dvh-1rem))] w-full overflow-y-auto rounded-t-[1.75rem] border border-border bg-sidebar p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-foreground shadow-[0_-24px_70px_-30px_rgba(0,0,0,0.95)] outline-none data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" /><Dialog.Title className="sr-only">{label}</Dialog.Title><Dialog.Description className="sr-only">Vyberte datum a čas v časovém pásmu cesty.</Dialog.Description>{panel}</Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>}
    {error ? <p id={errorId} role="alert" className="text-xs leading-5 text-amber-200">{error}</p> : null}
  </div>;
}
