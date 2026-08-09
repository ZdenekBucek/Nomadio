import { LoadingState } from "@/components/ui/loading-state";

export default function GlobalOverviewLoading() {
  return <LoadingState label="Načítání přehledu…"><div className="space-y-5 animate-pulse"><div className="h-24 rounded-2xl bg-muted/50" /><div className="h-40 rounded-[1.5rem] bg-muted/35" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-64 rounded-[1.5rem] bg-muted/35" /><div className="h-64 rounded-[1.5rem] bg-muted/35" /></div></div></LoadingState>;
}
