import { Surface } from "@/components/ui/surface";
import { LoadingState } from "@/components/ui/loading-state";
export default function Loading(){return <LoadingState label="Načítání mapy cesty…"><div className="animate-pulse"><div className="h-10 w-40 rounded-xl bg-muted"/><div className="mt-5 h-12 w-56 rounded-xl bg-muted"/><div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"><Surface depth="panel" className="h-[36rem] bg-muted/30"/><Surface depth="panel" className="h-72 bg-muted/30"/></div></div></LoadingState>}
