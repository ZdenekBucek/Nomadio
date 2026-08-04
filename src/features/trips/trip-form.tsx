import { CalendarDays, LockKeyhole, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

import { createTrip } from "./actions";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

type TripFormProps = {
  defaultCurrency: string;
};

export function TripForm({ defaultCurrency }: TripFormProps) {
  return (
    <Surface depth="panel" className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Nová cesta
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            Začněte plánovat
          </h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
          <Plus className="size-5" aria-hidden="true" />
        </span>
      </div>

      <form action={createTrip} className="mt-6 grid gap-4">
        <Field label="Název cesty" name="name" placeholder="Japonsko 2027" required />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Země" name="country" placeholder="Japonsko" />
          <Field label="První město" name="city" placeholder="Tokio" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Od" name="startDate" type="date" />
          <Field label="Do" name="endDate" type="date" />
        </div>

        <Field
          label="Hlavní měna"
          name="currency"
          defaultValue={defaultCurrency}
          inputMode="text"
          maxLength={3}
          pattern="[A-Za-z]{3}"
          required
        />

        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5 text-primary" aria-hidden="true" />
          Nová cesta je viditelná pouze vám.
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full">
          <CalendarDays aria-hidden="true" />
          Vytvořit cestu
        </Button>
      </form>
    </Surface>
  );
}

type FieldProps = React.ComponentProps<"input"> & {
  label: string;
  name: string;
};

function Field({ label, name, ...props }: FieldProps) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      <input className={inputClassName} name={name} {...props} />
    </label>
  );
}
