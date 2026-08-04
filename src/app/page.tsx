import { ArrowUpRight, CloudOff, Compass, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const foundations = [
  {
    icon: ShieldCheck,
    title: "Soukromí od začátku",
    description: "Tripy budou chráněné rolemi a Supabase RLS.",
  },
  {
    icon: Compass,
    title: "Jedna cesta, jeden kontext",
    description: "Plán, místa, rezervace i rozpočet budou držet pohromadě.",
  },
  {
    icon: CloudOff,
    title: "Připraveno na offline",
    description: "PWA základ počítá s používáním aplikace během cesty.",
  },
] as const;

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-x-clip px-4 py-4 sm:px-8 sm:py-8 lg:px-12">
      <div className="nomadio-ambient" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] max-w-6xl flex-col rounded-[1.5rem] border border-border bg-card/70 p-4 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:min-h-[calc(100dvh-4rem)] sm:rounded-[2rem] sm:p-8 dark:shadow-black/40 lg:p-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3" aria-label="Nomadio">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10">
              N
            </span>
            <span className="text-base font-semibold tracking-[-0.02em]">
              Nomadio
            </span>
          </div>

          <span className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
            Foundation · 01
          </span>
        </header>

        <section className="my-auto grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
          <div>
            <p className="mb-5 text-xs font-medium tracking-[0.24em] text-primary uppercase">
              Cesty bez chaosu
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.055em] text-balance sm:text-6xl sm:leading-[0.98] lg:text-7xl">
              Technický základ pro klidnější cestování.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Nomadio vzniká jako bezpečný prostor, kde každá cesta drží svůj
              plán, místa, rezervace i důležité věci pohromadě.
            </p>

            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 h-11 w-full max-w-full rounded-full px-4 sm:w-auto sm:px-5",
              )}
            >
              Přihlásit se
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </div>

          <div className="grid gap-3">
            {foundations.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="group rounded-2xl border border-border bg-card/70 p-5 transition-colors hover:bg-accent/50"
              >
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted/70 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-medium">{title}</h2>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Desktop pro plánování. Mobil na cestu.</span>
          <span>Next.js · Supabase-ready · PWA-ready</span>
        </footer>
      </div>
    </main>
  );
}
