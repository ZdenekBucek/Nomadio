import { Surface } from "@/components/ui/surface";

export default function TripSettingsLoading() {
  return <div aria-label="Načítám nastavení cesty" className="animate-pulse"><div className="h-10 w-40 rounded-xl bg-muted" /><div className="mt-5 h-10 w-64 rounded-xl bg-muted" /><div className="mt-6 grid gap-5 xl:grid-cols-2"><Surface depth="panel" className="h-[36rem] bg-muted/30" /><Surface depth="panel" className="h-[30rem] bg-muted/30" /></div></div>;
}
