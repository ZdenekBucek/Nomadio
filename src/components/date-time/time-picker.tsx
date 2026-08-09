"use client";

import { Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

type TimePickerProps = {
  className?: string;
  defaultValue?: string | null;
  disabled?: boolean;
  label: string;
  name: string;
};

/** A native, 24-hour time control wrapped in the shared Nomadio field design. */
export function TimePicker({ className, defaultValue = null, disabled = false, label, name }: TimePickerProps) {
  return (
    <label className={cn("grid gap-2 text-xs font-medium text-muted-foreground", className)}>
      {label}
      <span className="relative">
        <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--brand-highlight)]" aria-hidden="true" />
        <input
          className="h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 py-0 pr-3 pl-10 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65"
          defaultValue={defaultValue ?? ""}
          disabled={disabled}
          name={name}
          step={60}
          type="time"
        />
      </span>
    </label>
  );
}
