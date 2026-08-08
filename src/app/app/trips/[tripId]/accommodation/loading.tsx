import { Surface } from "@/components/ui/surface";

export default function AccommodationLoading() {
  return <div className="animate-pulse"><div className="h-5 w-36 rounded bg-muted" /><div className="mt-5 h-10 w-56 rounded bg-muted" /><div className="mt-6 grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <Surface key={item} className="h-20 bg-muted/30" />)}</div><Surface className="mt-6 h-44 bg-muted/30" /></div>;
}
