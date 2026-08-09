import { Surface } from "@/components/ui/surface";
import { LoadingState } from "@/components/ui/loading-state";

export default function TripSettingsLoading() {
  return <LoadingState label="Načítání nastavení cesty…"><div className="animate-pulse"><div className="h-10 w-40 rounded-xl bg-muted" /><div className="mt-5 h-10 w-64 rounded-xl bg-muted" /><div className="mt-6 grid gap-5"><Surface depth="panel" className="h-20 bg-muted/30" /><Surface depth="panel" className="h-20 bg-muted/30" /><Surface depth="panel" className="h-20 bg-muted/30" /></div></div></LoadingState>;
}
