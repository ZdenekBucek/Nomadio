import { Archive, CheckSquare2, ChevronLeft, Eye, Luggage, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { ChecklistDashboard } from "@/features/checklist/checklist-dashboard";
import { getChecklistData } from "@/features/checklist/checklist-data";
import { PackingForm, TaskForm } from "@/features/checklist/checklist-form";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ tripId: string }>; searchParams: Promise<{ checklist?: string; editPacking?: string; editTask?: string; new?: string }> };
const messages: Record<string, string> = { error: "Změnu se nepodařilo uložit.", "invalid-task": "Zkontrolujte údaje úkolu.", "invalid-packing": "Zkontrolujte balicí položku.", "task-created": "Úkol byl přidán.", "task-updated": "Úkol byl upraven.", "task-completed": "Úkol je hotový.", "task-reopened": "Úkol byl znovu otevřen.", "task-removed": "Úkol byl odstraněn.", "packing-created": "Položka byla přidána do balení.", "packing-updated": "Balicí položka byla upravena.", packed: "Položka je sbalená.", unpacked: "Položka byla vrácena k zabalení.", "packing-removed": "Balicí položka byla odstraněna." };

export default async function ChecklistPage({ params, searchParams }: Props) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const detail = await getTripDetail(tripId); if (!detail) notFound();
  const data = await getChecklistData(tripId, detail.currentUserId);
  const role = detail.members.find((member) => member.user_id === detail.currentUserId)?.role ?? "viewer";
  const archived = detail.trip.status === "archived"; const canEdit = (role === "owner" || role === "editor") && !archived;
  const selectedTask = query.editTask ? data.tasks.find((task) => task.id === query.editTask) ?? null : null;
  const selectedPacking = query.editPacking ? data.packingItems.find((item) => item.id === query.editPacking) ?? null : null;
  if ((query.editTask && !selectedTask) || (query.editPacking && !selectedPacking)) notFound();
  const formKind = selectedTask ? "task" : selectedPacking ? "packing" : query.new;
  const message = query.checklist ? messages[query.checklist] ?? messages.error : null;
  const failed = query.checklist?.startsWith("invalid") || query.checklist === "error";
  return <div className="min-w-0"><Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50"><ChevronLeft className="size-4" /> Zpět na přehled cesty</Link>
    <header className="mt-3 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="truncate text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><CheckSquare2 className="size-8 shrink-0 text-primary" /> Checklist</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Úkoly před cestou i samostatný seznam věcí k zabalení.</p></div><div className="flex flex-wrap items-center gap-2"><StatusPill tone={canEdit ? "brand" : "neutral"}>{memberRoleLabel(role)}</StatusPill>{canEdit ? <div className="hidden flex-wrap items-center gap-2 md:flex"><Link href={`/app/trips/${tripId}/checklist?new=task`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"><Plus className="size-4" /> Přidat úkol</Link><Link href={`/app/trips/${tripId}/checklist?new=packing`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm"><Luggage className="size-4" /> Přidat do balení</Link></div> : null}</div></header>
    {archived ? <Notice icon={<Archive className="size-4" />}>Archivovaný trip je pouze pro čtení.</Notice> : !canEdit ? <Notice icon={<Eye className="size-4" />}>Úkoly a balení můžete pouze číst.</Notice> : null}
    {message ? <div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", failed ? "border-amber-400/20 bg-amber-400/8 text-amber-200" : "border-emerald-400/20 bg-emerald-400/8 text-emerald-300")}>{message}</div> : null}
    {formKind === "task" ? <Editor title={selectedTask ? "Upravit úkol" : "Nový úkol"} close={`/app/trips/${tripId}/checklist`}><TaskForm canEdit={canEdit} task={selectedTask} travelers={data.travelers} tripId={tripId} /></Editor> : null}
    {formKind === "packing" ? <Editor title={selectedPacking ? "Upravit balicí položku" : "Nová balicí položka"} close={`/app/trips/${tripId}/checklist`}><PackingForm canEdit={canEdit} item={selectedPacking} travelers={data.travelers} tripId={tripId} /></Editor> : null}
    <ChecklistDashboard canEdit={canEdit} currentTravelerId={data.currentTravelerId} packingItems={data.packingItems} tasks={data.tasks} tripId={tripId} />
  </div>;
}
function Editor({ children, close, title }: { children: React.ReactNode; close: string; title: string }) { return <Surface depth="panel" className="mt-6 min-w-0 overflow-hidden p-4 sm:p-6"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold">{title}</h2><Link href={close} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">Zavřít</Link></div>{children}</Surface>; }
function Notice({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) { return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 shrink-0 text-primary">{icon}</span><p>{children}</p></div>; }
