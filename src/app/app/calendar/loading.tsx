import { LoadingState } from "@/components/ui/loading-state";

export default function CalendarLoading() {
  return <LoadingState label="Načítání kalendáře…"><div className="space-y-5"><div className="h-24 animate-pulse rounded-2xl bg-muted/40" /><div className="h-[30rem] animate-pulse rounded-[1.5rem] border border-border bg-card/40" /></div></LoadingState>;
}
