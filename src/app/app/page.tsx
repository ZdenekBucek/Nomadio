import { LogOut, MapPin, WalletCards } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
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

      <div className="relative mx-auto min-h-[calc(100dvh-2rem)] max-w-6xl rounded-[1.5rem] border border-border bg-card/75 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:min-h-[calc(100dvh-4rem)] sm:rounded-[2rem] sm:p-8 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3" aria-label="Nomadio">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              N
            </span>
            <span className="font-semibold tracking-[-0.02em]">Nomadio</span>
          </div>

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
      </div>
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
    <article className="min-w-0 rounded-2xl border border-border bg-muted/35 p-5">
      <Icon className="size-4 text-primary" aria-hidden="true" />
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </article>
  );
}
