import { ArrowRight, Compass, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { signInWithGoogle } from "@/features/auth/actions";
import { getSafeNextPath } from "@/features/auth/redirects";

export const metadata: Metadata = {
  title: "Přihlášení",
  description: "Přihlaste se do Nomadia bezpečně pomocí Google účtu.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);

  return (
    <main className="relative grid min-h-dvh overflow-x-clip px-4 py-4 sm:px-8 sm:py-8">
      <div className="nomadio-ambient" aria-hidden="true" />

      <Surface
        depth="panel"
        className="relative mx-auto grid w-full max-w-6xl overflow-hidden sm:rounded-[2rem] lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-12">
          <BrandMark tagline />

          <div className="my-auto py-14 sm:py-20">
            <p className="mb-5 text-xs font-medium tracking-[0.22em] text-primary uppercase">
              Vítejte zpět
            </p>
            <h1 className="max-w-xl text-4xl leading-[1.02] font-semibold tracking-[-0.055em] text-balance sm:text-6xl">
              Vaše cesty, bezpečně na jednom místě.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Přihlaste se přes Google. Nové cesty jsou vždy soukromé a přístup
              k profilu chrání Supabase Auth.
            </p>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Pokračováním použijete svůj Google účet pouze pro ověření identity.
          </p>
        </div>

        <div className="flex min-w-0 items-center border-t border-border bg-muted/30 p-5 sm:p-8 lg:border-t-0 lg:border-l lg:p-12">
          <Surface depth="card" className="w-full p-5 sm:p-7">
            <div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
              <Compass className="size-5" aria-hidden="true" />
            </div>
            <StatusPill tone="brand" className="mt-6">
              Bezpečný vstup
            </StatusPill>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
              Pokračujte do Nomadia
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Jeden bezpečný účet pro plánování na desktopu i používání během
              cesty.
            </p>

            {params.error ? (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                Přihlášení se nepodařilo. Zkuste to prosím znovu.
              </p>
            ) : null}

            <form action={signInWithGoogle} className="mt-7">
              <input type="hidden" name="next" value={nextPath} />
              <Button
                type="submit"
                size="lg"
                className="min-h-12 h-auto w-full whitespace-normal rounded-full px-4 py-3 text-center leading-5 sm:text-base"
              >
                Pokračovat přes Google
                <ArrowRight data-icon="inline-end" />
              </Button>
            </form>

            <div className="mt-6 flex gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>Session je uložena v zabezpečených cookies spravovaných serverem.</span>
            </div>
          </Surface>
        </div>
      </Surface>
    </main>
  );
}
