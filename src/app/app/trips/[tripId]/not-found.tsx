import { MapPinOff } from "lucide-react";
import Link from "next/link";

import { Surface } from "@/components/ui/surface";

export default function TripNotFound() {
  return (
    <Surface depth="panel" className="grid min-h-[28rem] place-items-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
          <MapPinOff className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-medium tracking-[0.18em] text-primary uppercase">
          Cesta není dostupná
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Tuto cestu nelze otevřít</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Cesta neexistuje, nebo k ní váš účet nemá přístup.
        </p>
        <Link
          href="/app/trips"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/14 px-4 text-sm font-medium text-[var(--brand-highlight)] transition hover:bg-primary/20"
        >
          Zpět na Moje cesty
        </Link>
      </div>
    </Surface>
  );
}
