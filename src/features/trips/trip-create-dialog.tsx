"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Plus, X } from "lucide-react";

import type { CountryOption } from "./countries";
import styles from "./trip-create-dialog.module.css";
import { TripForm } from "./trip-form";

type TripCreateDialogProps = {
  countries: CountryOption[];
  defaultCurrency: string;
  defaultTimezone: string;
};

export function TripCreateDialog({ countries, defaultCurrency, defaultTimezone }: TripCreateDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--brand-highlight))] px-4 text-sm font-medium text-primary-foreground shadow-[0_10px_28px_-12px_var(--brand-glow)] outline-none transition hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/45">
        <Plus className="size-4" aria-hidden="true" /> Přidat novou cestu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-5">
          <Dialog.Popup data-dialog-layout="responsive-half" className={`${styles.popup} bg-background outline-none transition data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:bg-card sm:shadow-[0_30px_100px_-30px_rgba(0,0,0,0.95)]`}>
            <Dialog.Title className="sr-only">Přidat novou cestu</Dialog.Title>
            <Dialog.Description className="sr-only">Vyplňte existující průvodce vytvořením soukromé cesty.</Dialog.Description>
            <Dialog.Close aria-label="Zavřít vytvoření cesty" className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-xl border border-border bg-background/85 text-muted-foreground backdrop-blur transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
            <TripForm countries={countries} defaultCurrency={defaultCurrency} defaultTimezone={defaultTimezone} showHeaderIcon={false} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
