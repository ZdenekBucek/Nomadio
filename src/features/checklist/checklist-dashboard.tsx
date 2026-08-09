"use client";

import { useState } from "react";
import { CalendarDays, Luggage, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { formatDateOnly } from "@/lib/date-time";
import { deletePackingItem, deleteTask, setPackingItemPacked, setTaskCompleted } from "./checklist-actions";
import { filterPacking, filterTasks, packingBagTypeLabels, packingCategories, packingCategoryLabels, summarizePacking, summarizeTasks, taskCategoryLabels, taskPriorityLabels, type ChecklistPackingItem, type ChecklistTask, type PackingFilter, type TaskFilter } from "./checklist-model";

const taskFilters: [TaskFilter, string][] = [["all", "Vše"], ["active", "Aktivní"], ["completed", "Hotové"], ["mine", "Moje"]];
const packingFilters: [PackingFilter, string][] = [["all", "Vše"], ["unpacked", "Nesbaleno"], ["packed", "Sbaleno"], ["mine", "Moje"]];

export function ChecklistDashboard({ canEdit, currentTravelerId, packingItems, tasks, tripId }: { canEdit: boolean; currentTravelerId: string | null; packingItems: ChecklistPackingItem[]; tasks: ChecklistTask[]; tripId: string }) {
  const [activeSection, setActiveSection] = useState<"tasks" | "packing">("tasks");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [packingFilter, setPackingFilter] = useState<PackingFilter>("all");
  const visibleTasks = filterTasks(tasks, taskFilter, currentTravelerId);
  const visiblePacking = filterPacking(packingItems, packingFilter, currentTravelerId);
  const taskSummary = summarizeTasks(tasks);
  const packingSummary = summarizePacking(packingItems);
  const mobileAction = activeSection === "tasks"
    ? { href: `/app/trips/${tripId}/checklist?new=task`, icon: Plus, label: "Přidat úkol" }
    : { href: `/app/trips/${tripId}/checklist?new=packing`, icon: Luggage, label: "Přidat do balení" };
  const MobileActionIcon = mobileAction.icon;

  return <div className="mt-6 min-w-0">
    <div role="tablist" aria-label="Část checklistu" className="mb-4 grid grid-cols-2 rounded-2xl border border-border bg-muted/20 p-1 md:hidden">
      <SectionTab active={activeSection === "tasks"} controls="checklist-tasks" onClick={() => setActiveSection("tasks")}>Úkoly</SectionTab>
      <SectionTab active={activeSection === "packing"} controls="checklist-packing" onClick={() => setActiveSection("packing")}>Balení</SectionTab>
    </div>
    {canEdit ? <Link href={mobileAction.href} className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground md:hidden"><MobileActionIcon className="size-4" /> {mobileAction.label}</Link> : null}
    <div className="grid min-w-0 gap-7 md:grid-cols-2 md:items-start">
      <section id="checklist-tasks" aria-labelledby="tasks-title" className={`${activeSection === "tasks" ? "block" : "hidden"} min-w-0 md:block`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 id="tasks-title" className="text-xl font-semibold">Úkoly</h2></div>
          <SummaryCard label="Souhrn úkolů" completed={taskSummary.completed} remaining={taskSummary.remaining} total={taskSummary.total} verb="hotovo" />
          <FilterButtons ariaLabel="Filtr úkolů" options={taskFilters} selected={taskFilter} onSelect={(value) => setTaskFilter(value as TaskFilter)} />
        </div>
        {visibleTasks.length ? <div className="mt-3 space-y-2">{visibleTasks.map((task) => <TaskCard key={task.id} canEdit={canEdit} task={task} tripId={tripId} />)}</div> : <Empty>Tomuto filtru neodpovídá žádný úkol.</Empty>}
      </section>
      <section id="checklist-packing" aria-labelledby="packing-title" className={`${activeSection === "packing" ? "block" : "hidden"} min-w-0 md:block`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 id="packing-title" className="text-xl font-semibold">Balení</h2></div>
          <SummaryCard label="Souhrn balení" completed={packingSummary.packed} remaining={packingSummary.remaining} total={packingSummary.total} verb="sbaleno" />
          <FilterButtons ariaLabel="Filtr balení" options={packingFilters} selected={packingFilter} onSelect={(value) => setPackingFilter(value as PackingFilter)} />
        </div>
        <div className="mt-3 space-y-4">{packingCategories.map((category) => {
          const items = visiblePacking.filter((item) => item.category === category);
          if (!items.length) return null;
          const categoryItems = packingItems.filter((item) => item.category === category);
          const packed = categoryItems.filter((item) => item.is_packed).length;
          return <div key={category} className="min-w-0"><div className="flex items-baseline justify-between gap-3 px-1"><h3 className="text-sm font-medium">{packingCategoryLabels[category]}</h3><span className="shrink-0 text-xs text-muted-foreground">{packed} / {categoryItems.length} sbaleno</span></div><div className="mt-2 space-y-2">{items.map((item) => <PackingCard key={item.id} canEdit={canEdit} item={item} tripId={tripId} />)}</div></div>;
        })}{visiblePacking.length ? null : <Empty>Tomuto filtru neodpovídá žádná balicí položka.</Empty>}</div>
      </section>
    </div>
  </div>;
}

function SectionTab({ active, children, controls, onClick }: { active: boolean; children: React.ReactNode; controls: string; onClick: () => void }) { return <button role="tab" aria-selected={active} aria-controls={controls} type="button" onClick={onClick} className={`min-h-11 rounded-xl text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{children}</button>; }

function SummaryCard({ completed, label, remaining, total, verb }: { completed: number; label: string; remaining: number; total: number; verb: string }) {
  const progress = total ? Math.round((completed / total) * 100) : 0;
  return <Surface aria-label={label} className="min-w-0 p-3.5"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium text-muted-foreground">{label.replace("Souhrn ", "")}</p><p className="mt-1 text-xl font-semibold tracking-[-0.03em]"><span>{completed} / {total}</span> <span className="text-sm font-normal text-muted-foreground">{verb}</span></p><p className="mt-1 text-xs text-muted-foreground">{remaining} zbývá</p></div><span className="text-xs text-muted-foreground">{progress} %</span></div><div role="progressbar" aria-label={`${label}: ${completed} z ${total} ${verb}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div></Surface>;
}

function FilterButtons({ ariaLabel, onSelect, options, selected }: { ariaLabel: string; onSelect: (value: string) => void; options: [string, string][]; selected: string }) { return <div role="group" aria-label={ariaLabel} className="flex max-w-full flex-wrap gap-1.5">{options.map(([value, label]) => <button key={value} type="button" onClick={() => onSelect(value)} aria-pressed={selected === value} className={`min-h-9 rounded-full border px-3 text-xs font-medium ${selected === value ? "border-primary/40 bg-primary/15 text-[var(--brand-highlight)]" : "border-border text-muted-foreground"}`}>{label}</button>)}</div>; }

function TaskCard({ canEdit, task, tripId }: { canEdit: boolean; task: ChecklistTask; tripId: string }) {
  const completed = task.status === "completed";
  return <Surface className={`min-w-0 p-3 ${completed ? "opacity-70" : ""}`}><div className="flex min-w-0 items-start gap-3"><Toggle action={setTaskCompleted} canEdit={canEdit} checked={completed} idName="taskId" id={task.id} stateName="completed" tripId={tripId} label={`${completed ? "Obnovit" : "Dokončit"} úkol ${task.title}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`font-medium ${completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</h3><StatusPill tone={task.priority === "high" ? "warning" : completed ? "success" : "neutral"}>{taskPriorityLabels[task.priority]}</StatusPill></div><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">{task.due_date ? <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatDate(task.due_date)}</span> : null}{task.travelerName ? <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" /> {task.travelerName}</span> : null}<span>{taskCategoryLabels[task.category]}</span></div>{task.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p> : null}</div>{canEdit ? <div className="flex shrink-0 gap-1"><Link aria-label={`Upravit úkol ${task.title}`} href={`/app/trips/${tripId}/checklist?editTask=${task.id}`} className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground"><Pencil className="size-4" /></Link><Delete action={deleteTask} idName="taskId" id={task.id} tripId={tripId} label={`Smazat úkol ${task.title}`} /></div> : null}</div></Surface>;
}

function PackingCard({ canEdit, item, tripId }: { canEdit: boolean; item: ChecklistPackingItem; tripId: string }) {
  return <Surface className={`min-w-0 p-3 ${item.is_packed ? "opacity-70" : ""}`}><div className="flex min-w-0 items-start gap-3"><Toggle action={setPackingItemPacked} canEdit={canEdit} checked={item.is_packed} idName="packingItemId" id={item.id} stateName="packed" tripId={tripId} label={`${item.is_packed ? "Vybalit" : "Sbalit"} ${item.name}`} /><div className="min-w-0 flex-1"><p className={`font-medium ${item.is_packed ? "text-muted-foreground line-through" : ""}`}>{item.name}{item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">{item.travelerName ?? "Společné / neurčeno"}{item.bag_type ? ` · ${packingBagTypeLabels[item.bag_type]}` : ""}</p></div>{canEdit ? <div className="flex shrink-0 gap-1"><Link aria-label={`Upravit balení ${item.name}`} href={`/app/trips/${tripId}/checklist?editPacking=${item.id}`} className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground"><Pencil className="size-4" /></Link><Delete action={deletePackingItem} idName="packingItemId" id={item.id} tripId={tripId} label={`Smazat balení ${item.name}`} /></div> : null}</div></Surface>;
}

function Toggle({ action, canEdit, checked, id, idName, label, stateName, tripId }: { action: (data: FormData) => Promise<void>; canEdit: boolean; checked: boolean; id: string; idName: string; label: string; stateName: string; tripId: string }) {
  return <form action={action}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name={idName} value={id} /><input type="hidden" name={stateName} value={String(!checked)} /><button type="submit" disabled={!canEdit} role="checkbox" aria-checked={checked} aria-label={label} className={`grid size-10 shrink-0 place-items-center rounded-full border-2 text-base disabled:cursor-default ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent"}`}>✓</button></form>;
}
function Delete({ action, id, idName, label, tripId }: { action: (data: FormData) => Promise<void>; id: string; idName: string; label: string; tripId: string }) { return <form action={action}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name={idName} value={id} /><button aria-label={label} className="grid size-9 place-items-center rounded-xl border border-red-400/20 text-red-300"><Trash2 className="size-4" /></button></form>; }
function Empty({ children }: { children: React.ReactNode }) { return <Surface className="mt-3 p-4 text-sm text-muted-foreground">{children}</Surface>; }
function formatDate(value: string) { return formatDateOnly(value); }
