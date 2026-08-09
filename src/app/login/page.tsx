import { MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { BrandMark } from "@/components/brand/brand-mark";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { getSafeNextPath } from "@/features/auth/redirects";

export const metadata: Metadata = {
  title: "Přihlášení",
  description: "Přihlaste se do Nomadia bezpečně pomocí Google účtu.",
};

type LoginPageProps = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);

  return (
    <main className="min-h-dvh overflow-x-clip bg-background p-0 text-foreground md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(25rem,0.8fr)]">
      <section className="relative isolate flex min-h-[32dvh] overflow-hidden border-b border-border px-5 py-6 sm:min-h-[36dvh] sm:px-8 md:min-h-dvh md:border-r md:border-b-0 md:px-10 md:py-10 lg:px-14">
        <Image
          src="/images/login/nomadio-login-hero.png"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 60vw, 100vw"
          className="object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.34),rgba(3,7,18,0.72)_100%)] md:bg-[linear-gradient(90deg,rgba(3,7,18,0.82),rgba(3,7,18,0.48)_58%,rgba(3,7,18,0.2))]" aria-hidden="true" />

        <div className="relative z-10 flex w-full flex-col justify-between">
          <BrandMark tagline className="[&_span:nth-child(2)>span:first-child]:text-white [&_span:nth-child(2)>span:last-child]:text-primary" />
          <div className="mt-14 max-w-lg md:mt-auto md:mb-[12vh]">
            <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">Plan · Discover · Go</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">Cesty, které máte pod kontrolou.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65 sm:text-base">Od prvního nápadu až po návrat. Klidně, přehledně a společně.</p>
          </div>
          <div className="hidden text-xs text-white/52 md:block">Váš další příběh začíná tady.</div>
        </div>
      </section>

      <section className="flex min-w-0 items-center px-5 py-9 sm:px-8 md:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <BrandMark className="md:hidden" />
          <p className="mt-8 text-xs font-semibold tracking-[0.22em] text-primary uppercase md:mt-0">Nomadio</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Vše pro vaše cesty.<br />Na jednom místě.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Plánujte itinerář, rezervace, rozpočet a dokumenty společně.</p>

          {params.error ? <div role="alert" className="mt-7 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive"><strong className="font-medium">Přihlášení se nepodařilo.</strong><span className="mt-1 block text-destructive/80">Zkuste to prosím znovu.</span></div> : null}

          <div className="mt-8"><GoogleSignInButton nextPath={nextPath} /></div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" /> Přihlášení je zabezpečeno přes Google.</p>
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground"><span>Soukromé cesty</span><span aria-hidden="true">·</span><span>Sdílení s blízkými</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden="true" /> Vše na jednom místě</span></div>
        </div>
      </section>
    </main>
  );
}
