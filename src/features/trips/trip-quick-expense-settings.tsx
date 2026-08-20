"use client";

import { useFormStatus } from "react-dom";

import { updateTripQuickExpenseBeforeStart } from "./settings-actions";

export function TripQuickExpenseSettings({
  canEdit,
  enabled,
  globalEnabled,
  tripId,
}: {
  canEdit: boolean;
  enabled: boolean;
  globalEnabled: boolean;
  tripId: string;
}) {
  return (
    <section aria-labelledby="trip-quick-expense-title" className="border-t border-border pt-5">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="min-w-0">
          <h3 id="trip-quick-expense-title" className="text-sm font-semibold">Rychlé výdaje</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Zobrazit tuto cestu v rychlém přidávání výdajů ještě před jejím začátkem.</p>
          {!globalEnabled ? <p className="mt-2 text-xs text-muted-foreground/75">Globální rychlé přidávání výdajů je aktuálně vypnuté.</p> : null}
        </div>
        <form action={updateTripQuickExpenseBeforeStart}>
          <input type="hidden" name="tripId" value={tripId} />
          <ToggleSubmit canEdit={canEdit} enabled={enabled} />
        </form>
      </div>
    </section>
  );
}

function ToggleSubmit({ canEdit, enabled }: { canEdit: boolean; enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="quickExpenseBeforeStartEnabled"
      value={enabled ? "false" : "true"}
      aria-pressed={enabled}
      aria-label={enabled ? "Zakázat rychlé výdaje před začátkem cesty" : "Povolit rychlé výdaje před začátkem cesty"}
      disabled={!canEdit || pending}
      className="relative h-7 w-12 shrink-0 rounded-full border border-border bg-muted transition data-[enabled=true]:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      data-enabled={enabled}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-foreground shadow transition-[left] ${enabled ? "left-6" : "left-1"}`} aria-hidden="true" />
    </button>
  );
}
