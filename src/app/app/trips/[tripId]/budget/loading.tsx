import { Surface } from "@/components/ui/surface";
import { LoadingState } from "@/components/ui/loading-state";

export default function BudgetLoading() {
  return <LoadingState label="Načítání rozpočtu…"><div className="animate-pulse"><div className="h-5 w-32 rounded bg-muted" /><div className="mt-5 h-10 w-56 rounded bg-muted" /><Surface depth="panel" className="mt-7 h-36" /><div className="mt-6 h-12 rounded-xl bg-muted/60" /><Surface className="mt-5 h-72" /></div></LoadingState>;
}
