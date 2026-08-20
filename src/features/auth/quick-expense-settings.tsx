"use client";

import { useFormStatus } from "react-dom";

import { updateQuickExpenseFabPreference } from "./preferences-actions";

export function QuickExpenseSettings({ enabled }: { enabled: boolean }) {
  return (
    <form action={updateQuickExpenseFabPreference} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/55 p-4">
      <div className="min-w-0">
        <p className="font-medium">Rychlé přidávání výdajů</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">Zobrazit plovoucí tlačítko pro rychlé přidání výdaje během probíhající cesty.</p>
      </div>
      <ToggleSubmit enabled={enabled} />
    </form>
  );
}

function ToggleSubmit({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="quickExpenseFabEnabled"
      value={enabled ? "false" : "true"}
      aria-pressed={enabled}
      aria-label={enabled ? "Vypnout rychlé přidávání výdajů" : "Zapnout rychlé přidávání výdajů"}
      disabled={pending}
      className="relative h-7 w-12 shrink-0 rounded-full border border-border bg-muted transition data-[enabled=true]:bg-primary disabled:opacity-60"
      data-enabled={enabled}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-foreground shadow transition-[left] ${enabled ? "left-6" : "left-1"}`} aria-hidden="true" />
    </button>
  );
}
