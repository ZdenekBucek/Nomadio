"use client";

import { AlertTriangle, LoaderCircle, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function OverviewPartialWarning() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="status" className="mt-5 flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/6 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex min-w-0 items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" /><span><span className="font-medium">Některé údaje se nepodařilo načíst.</span><span className="mt-0.5 block text-xs text-amber-100/70">Zobrazený přehled nemusí být kompletní.</span></span></p>
      <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-amber-300/25 px-3 text-sm font-medium text-amber-100 outline-none transition hover:bg-amber-300/10 focus-visible:ring-2 focus-visible:ring-amber-300/60 disabled:cursor-wait disabled:opacity-60 sm:self-auto">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RotateCw className="size-4" aria-hidden="true" />}
        {pending ? "Načítám…" : "Zkusit znovu"}
      </button>
    </div>
  );
}
