import { MapPin, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";

import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { getAuthenticatedProfile } from "@/features/auth/session";
import { ProfileAvatar } from "@/features/navigation/app-shell";

export default async function AppPage() {
  const auth = await getAuthenticatedProfile();

  if (!auth) {
    redirect("/login?next=/app");
  }

  const { profile } = auth;

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
            Přehled
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Vítejte zpět, {profile.displayName.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Odtud budete spravovat své cesty, plány a dokumenty.
          </p>
        </div>
        <StatusPill tone="success" className="self-start sm:self-auto">
          Účet je aktivní
        </StatusPill>
      </header>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Surface depth="panel" className="p-5 sm:p-7">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Váš profil
          </p>
          <div className="mt-5 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <ProfileAvatar profile={profile} size="large" />
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                {profile.displayName}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>

          <section className="mt-8" aria-labelledby="preferences-title">
          <h2 id="preferences-title" className="text-sm font-medium">
            Výchozí nastavení
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileFact
              icon={WalletCards}
              label="Hlavní měna"
              value={profile.defaultCurrency}
            />
            <ProfileFact
              icon={MapPin}
              label="Jazyk a oblast"
              value={profile.locale}
            />
            <ProfileFact
              icon={MapPin}
              label="Časové pásmo"
              value={profile.timezone}
            />
          </div>
          </section>
        </Surface>

        <Surface depth="panel" className="flex min-h-56 flex-col p-5 sm:p-7">
          <StatusPill tone="brand" className="self-start">
            Další krok
          </StatusPill>
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
            Vaše první cesta
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            V dalším řezu přidáme bezpečné vytvoření soukromé cesty a přehled
            „Moje cesty“.
          </p>
          <div className="mt-auto pt-8 text-xs text-muted-foreground">
            Funkce zatím není aktivní.
          </div>
        </Surface>
      </div>
    </div>
  );
}

type ProfileFactProps = {
  icon: typeof MapPin;
  label: string;
  value: string;
};

function ProfileFact({ icon: Icon, label, value }: ProfileFactProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-colors hover:border-primary/25 hover:bg-accent/35">
      <span className="grid size-8 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </article>
  );
}
