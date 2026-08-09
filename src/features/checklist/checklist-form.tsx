import type { PackingItemRow, TaskRow, TripTravelerRow } from "@/lib/supabase/database.types";
import { DatePicker } from "@/components/date-time/date-picker";
import { createPackingItem, createTask, updatePackingItem, updateTask } from "./checklist-actions";
import { packingBagTypeLabels, packingBagTypes, packingCategories, packingCategoryLabels, taskCategories, taskCategoryLabels, taskPriorities, taskPriorityLabels, taskStatuses, taskStatusLabels } from "./checklist-model";

const field = "mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

export function TaskForm({ canEdit, task, travelers, tripId }: { canEdit: boolean; task: TaskRow | null; travelers: TripTravelerRow[]; tripId: string }) {
  const action = task ? updateTask : createTask;
  return <form action={action} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
    <input type="hidden" name="tripId" value={tripId} />{task ? <input type="hidden" name="taskId" value={task.id} /> : null}
    <label className="min-w-0 text-sm font-medium sm:col-span-2">Název úkolu<input className={field} name="title" required maxLength={200} defaultValue={task?.title ?? ""} disabled={!canEdit} /></label>
    <label className="min-w-0 text-sm font-medium sm:col-span-2">Popis<textarea className={`${field} min-h-24 py-3`} name="description" maxLength={4000} defaultValue={task?.description ?? ""} disabled={!canEdit} /></label>
    <Select label="Kategorie" name="category" value={task?.category ?? "preparation"} disabled={!canEdit} options={taskCategories.map((value) => [value, taskCategoryLabels[value]])} />
    <Select label="Priorita" name="priority" value={task?.priority ?? "normal"} disabled={!canEdit} options={taskPriorities.map((value) => [value, taskPriorityLabels[value]])} />
    <DatePicker label="Termín" name="dueDate" defaultValue={task?.due_date ?? ""} disabled={!canEdit} />
    <Select label="Přiřadit cestovateli" name="assignedTravelerId" value={task?.assigned_traveler_id ?? ""} disabled={!canEdit} options={[["", "Bez přiřazení"], ...travelers.map((traveler) => [traveler.id, traveler.display_name] as [string, string])]} />
    <Select label="Stav" name="status" value={task?.status ?? "todo"} disabled={!canEdit} options={taskStatuses.map((value) => [value, taskStatusLabels[value]])} />
    <div className="sm:col-span-2"><button disabled={!canEdit} className="min-h-11 rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--brand-highlight))] px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{task ? "Uložit úkol" : "Přidat úkol"}</button></div>
  </form>;
}

export function PackingForm({ canEdit, item, travelers, tripId }: { canEdit: boolean; item: PackingItemRow | null; travelers: TripTravelerRow[]; tripId: string }) {
  const action = item ? updatePackingItem : createPackingItem;
  return <form action={action} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
    <input type="hidden" name="tripId" value={tripId} />{item ? <input type="hidden" name="packingItemId" value={item.id} /> : null}
    <label className="min-w-0 text-sm font-medium sm:col-span-2">Položka<input className={field} name="name" required maxLength={160} defaultValue={item?.name ?? ""} disabled={!canEdit} /></label>
    <Select label="Kategorie" name="category" value={item?.category ?? "other"} disabled={!canEdit} options={packingCategories.map((value) => [value, packingCategoryLabels[value]])} />
    <label className="min-w-0 text-sm font-medium">Množství<input className={field} type="number" name="quantity" min={1} max={999} defaultValue={item?.quantity ?? ""} disabled={!canEdit} /></label>
    <Select label="Komu patří" name="travelerId" value={item?.traveler_id ?? ""} disabled={!canEdit} options={[["", "Společné / neurčeno"], ...travelers.map((traveler) => [traveler.id, traveler.display_name] as [string, string])]} />
    <Select label="Zavazadlo" name="bagType" value={item?.bag_type ?? ""} disabled={!canEdit} options={[["", "Neuvedeno"], ...packingBagTypes.map((value) => [value, packingBagTypeLabels[value]] as [string, string])]} />
    <div className="sm:col-span-2"><button disabled={!canEdit} className="min-h-11 rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--brand-highlight))] px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{item ? "Uložit položku" : "Přidat do balení"}</button></div>
  </form>;
}

function Select({ disabled, label, name, options, value }: { disabled: boolean; label: string; name: string; options: [string, string][]; value: string }) {
  return <label className="min-w-0 text-sm font-medium">{label}<select aria-label={label} className={field} name={name} defaultValue={value} disabled={disabled}>{options.map(([key, text]) => <option key={key || "empty"} value={key}>{text}</option>)}</select></label>;
}
