import { StickyNote } from "lucide-react";
import Link from "next/link";
import { Surface } from "@/components/ui/surface";

export default async function NotesPage({ params }: { params: Promise<{ tripId: string }> }) { const { tripId } = await params; return <div className="max-w-2xl"><Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center rounded-xl px-2 text-sm text-muted-foreground hover:bg-muted/50">Zpět na přehled cesty</Link><Surface depth="panel" className="mt-5 p-6 sm:p-8"><StickyNote className="size-6 text-primary" aria-hidden="true" /><h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">Poznámky</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Poznámky k této cestě připravujeme v samostatném řezu.</p></Surface></div>; }
