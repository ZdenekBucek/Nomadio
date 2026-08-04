import { Surface } from "@/components/ui/surface";

export default function TripOverviewLoading() {
  return (
    <div className="animate-pulse" aria-label="Načítání detailu cesty">
      <div className="h-72 rounded-[1.75rem] border border-border bg-muted/40" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <div className="grid gap-5">
          <Surface depth="panel" className="h-64 bg-muted/30" />
          <Surface depth="panel" className="h-64 bg-muted/30" />
        </div>
        <Surface depth="panel" className="h-96 bg-muted/30" />
      </div>
    </div>
  );
}
