import { Surface } from "@/components/ui/surface";

export default function DocumentsLoading() {
  return <div className="animate-pulse"><div className="h-5 w-32 rounded bg-muted" /><div className="mt-5 h-10 w-56 rounded bg-muted" /><div className="mt-8 grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Surface key={index} className="h-24" />)}</div><Surface className="mt-6 h-72" /></div>;
}
