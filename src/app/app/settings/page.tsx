import { redirect } from "next/navigation";
import { Settings2, Sparkles } from "lucide-react";

import { Surface } from "@/components/ui/surface";
import { getAuthenticatedProfile } from "@/features/auth/session";
import { QuickExpenseSettings } from "@/features/auth/quick-expense-settings";

type SettingsPageProps = { searchParams: Promise<{ preference?: string }> };

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [auth, query] = await Promise.all([getAuthenticatedProfile(), searchParams]);
  if (!auth) redirect("/login?next=/app/settings");
  return (
    <div className="mx-auto max-w-3xl">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">Nomadio</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"><Settings2 className="size-8 text-primary" aria-hidden="true" /> Nastavení</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Osobní nastavení a rychlé akce aplikace.</p>
      </header>
      {query.preference === "saved" ? <p role="status" className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-300">Nastavení bylo uloženo.</p> : null}
      {query.preference === "error" || query.preference === "invalid" ? <p role="alert" className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-200">Nastavení se nepodařilo uložit.</p> : null}
      <Surface depth="panel" className="mt-6 p-5 sm:p-6">
        <div className="flex items-center gap-3"><Sparkles className="size-5 text-primary" aria-hidden="true" /><div><h2 className="font-semibold">Rychlé akce</h2><p className="mt-1 text-sm text-muted-foreground">Nastavte si chování plovoucích akcí.</p></div></div>
        <div className="mt-4"><QuickExpenseSettings enabled={auth.profile.quickExpenseFabEnabled} /></div>
      </Surface>
    </div>
  );
}
