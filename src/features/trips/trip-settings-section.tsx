"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function TripSettingsSection({
  children,
  defaultOpen = false,
  description,
  icon,
  id,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  description: string;
  icon: ReactNode;
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.8)]">
      <button
        type="button"
        className="group flex min-h-20 w-full items-center justify-between gap-4 px-4 py-4 text-left outline-none transition hover:bg-muted/25 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset sm:px-5"
        aria-controls={id}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">{icon}</span>
          <span className="min-w-0">
            <span className="block text-base font-semibold sm:text-lg">{title}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">{description}</span>
          </span>
        </span>
        <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-primary")} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open} className="border-t border-border px-4 pb-5 sm:px-5">
        {children}
      </div>
    </section>
  );
}
