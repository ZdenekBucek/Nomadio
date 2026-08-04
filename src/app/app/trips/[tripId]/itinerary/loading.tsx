import { Surface } from "@/components/ui/surface";
export default function Loading() { return <div className="animate-pulse"><div className="h-10 w-40 rounded-xl bg-muted"/><div className="mt-5 h-12 w-64 rounded-xl bg-muted"/><div className="mt-6 grid gap-5 xl:grid-cols-2">{[0,1].map((item) => <Surface key={item} className="h-80" depth="panel"/>)}</div></div>; }
