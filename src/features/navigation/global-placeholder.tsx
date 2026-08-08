import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Surface } from "@/components/ui/surface";

export function GlobalPlaceholder({ description, title }: { description: string; title: string }) { return <div className="max-w-2xl"><Link href="/app/trips" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground hover:bg-muted/50"><ArrowLeft className="size-4" /> Moje cesty</Link><Surface depth="panel" className="mt-5 p-6 sm:p-8"><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Globální modul</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p><p className="mt-7 text-xs text-muted-foreground">Připravujeme v dalším samostatném řezu.</p></Surface></div>; }
