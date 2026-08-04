import { LogOut, MapPin, WalletCards } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { signOut } from "@/features/auth/actions";
import { getProfileViewModel } from "@/features/auth/profile";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/login?next=/app");
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/app");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();
  const viewModel = getProfileViewModel(profile, {
    avatarUrl:
      userData.user.user_metadata.avatar_url ??
      userData.user.user_metadata.picture,
    displayName:
      userData.user.user_metadata.full_name ?? userData.user.user_metadata.name,
    email: userData.user.email,
  });

  return (
    <main className="relative min-h-dvh overflow-x-clip px-4 py-4 sm:px-8 sm:py-8">
      <div className="nomadio-ambient" aria-hidden="true" />

      <Surface
        depth="panel"
        className="relative mx-auto min-h-[calc(100dvh-2rem)] max-w-6xl overflow-hidden p-5 sm:min-h-[calc(100dvh-4rem)] sm:rounded-[2rem] sm:p-8 lg:p-10"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <BrandMark />

          <form action={signOut}>
            <Button type="submit" variant="outline" className="rounded-full">
              Odhlásit
              <LogOut data-icon="inline-end" />
            </Button>
          </form>
        </header>

        <section className="py-10 sm:py-14">
          <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
            Váš profil
          </p>
          <StatusPill tone="success" className="mt-4">
            Účet je aktivní
          </StatusPill>
          <div className="mt-5 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-muted text-xl font-semibold text-primary">
              {viewModel.avatarUrl ? (
                <Image
                  src={viewModel.avatarUrl}
                  alt={`Profilová fotografie: ${viewModel.displayName}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  priority
                />
              ) : (
                viewModel.initials
              )}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                {viewModel.displayName}
              </h1>
              <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">
                {viewModel.email}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="preferences-title">
          <h2 id="preferences-title" className="text-sm font-medium">
            Výchozí nastavení
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileFact
              icon={WalletCards}
              label="Hlavní měna"
              value={viewModel.defaultCurrency}
            />
            <ProfileFact
              icon={MapPin}
              label="Jazyk a oblast"
              value={viewModel.locale}
            />
            <ProfileFact
              icon={MapPin}
              label="Časové pásmo"
              value={viewModel.timezone}
            />
          </div>
        </section>
      </Surface>
    </main>
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
