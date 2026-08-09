"use client";

import { ImagePlus, Save, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-time/date-range-picker";
import { TimezoneCombobox } from "@/features/timezones/timezone-combobox";
import type { TripRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

import type { TripCover } from "./trip-cover";
import { removeTripCover, type TripSettingsActionState, updateTripSettings, uploadTripCover } from "./settings-actions";
import { tripCoverClasses } from "./trip-presentation";

const controlClassName =
  "mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65";

const coverOptions = [
  { className: "from-violet-950 via-indigo-900 to-fuchsia-900", label: "Soumrak", value: "violet" },
  { className: "from-slate-950 via-sky-950 to-cyan-900", label: "Oceán", value: "ocean" },
  { className: "from-slate-950 via-rose-950 to-amber-800", label: "Západ slunce", value: "sunset" },
  { className: "from-slate-950 via-emerald-950 to-teal-900", label: "Les", value: "forest" },
] as const;

const initialState: TripSettingsActionState = { error: null };

export function TripSettingsForm({ canEdit, cover, trip, includeCover = true }: { canEdit: boolean; cover: TripCover; trip: TripRow; includeCover?: boolean }) {
  const [state, formAction, pending] = useActionState(updateTripSettings, initialState);
  const errorMessage = state.error === "dates"
    ? "Datum návratu nesmí být před datem odjezdu."
    : state.error === "invalid"
      ? "Zkontrolujte vyplněné údaje."
      : state.error === "save"
        ? "Změny se nepodařilo uložit. Zkuste to znovu."
        : null;

  return (
    <div className="mt-6 grid gap-5">
      <form id="trip-settings-form" action={formAction} className="grid gap-5">
        <input type="hidden" name="tripId" value={trip.id} />
        <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Název cesty" name="name" defaultValue={trip.name} maxLength={120} required disabled={!canEdit} className="sm:col-span-2" />
        <TextAreaField label="Krátký popis" name="description" defaultValue={trip.description ?? ""} maxLength={600} disabled={!canEdit} className="sm:col-span-2" />
        <DateRangePicker
          className="sm:col-span-2"
          defaultStartDate={trip.start_date}
          defaultEndDate={trip.end_date}
          disabled={!canEdit}
          startName="startDate"
          endName="endDate"
        />
        <Field label="Hlavní měna" name="currency" defaultValue={trip.currency} maxLength={3} pattern="[A-Za-z]{3}" required disabled={!canEdit} />
        <TimezoneCombobox name="timezone" defaultValue={trip.timezone} disabled={!canEdit} />
        <SelectField label="Fáze cesty" name="status" defaultValue={trip.status} disabled={!canEdit} className="sm:col-span-2">
          {trip.status === "archived" ? <option value="archived">Archivováno</option> : null}
          {trip.status === "active" ? <option value="active">Probíhá</option> : null}
          {trip.status === "completed" ? <option value="completed">Dokončeno</option> : null}
          <option value="idea">Nápad</option>
          <option value="planning">Plánuji</option>
          <option value="ready">Připraveno</option>
        </SelectField>
        </div>

        {errorMessage ? <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-sm text-amber-200">{errorMessage}</p> : null}
        {canEdit ? <Button type="submit" size="lg" className="justify-self-start" disabled={pending}><Save aria-hidden="true" />{pending ? "Ukládám…" : "Uložit nastavení"}</Button> : null}
      </form>

      {includeCover ? <TripCoverSettings canEdit={canEdit} cover={cover} trip={trip} /> : null}
    </div>
  );
}

export function TripCoverSettings({ canEdit, cover, trip }: { canEdit: boolean; cover: TripCover; trip: TripRow }) {
  return (
      <div className="grid gap-4">
        <fieldset form="trip-settings-form" disabled={!canEdit}>
          <legend className="text-xs font-medium text-muted-foreground">Barevný cover</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {coverOptions.map((coverOption) => (
              <label key={coverOption.value} className="group cursor-pointer has-disabled:cursor-not-allowed">
                <input form="trip-settings-form" className="peer sr-only" type="radio" name="coverVariant" value={coverOption.value} defaultChecked={trip.cover_variant === coverOption.value} />
                <span className={cn("flex h-20 items-end rounded-xl border border-border bg-gradient-to-br p-2 text-[0.68rem] text-white transition peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/30 peer-disabled:opacity-65", coverOption.className)}>{coverOption.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <section aria-labelledby="trip-cover-title" className="rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 id="trip-cover-title" className="text-sm font-semibold">Obrázek cesty</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">JPEG, PNG nebo WebP do 5 MB. Bez obrázku se použije vybraný barevný cover.</p>
          </div>
          <div className={cn("relative h-20 w-full overflow-hidden rounded-xl border border-border sm:w-36", tripCoverClasses[cover.variant])}>
            {cover.imageUrl ? <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover.imageUrl} alt="Aktuální obrázek cesty" className="absolute inset-0 size-full object-cover" />
            </> : <span className="absolute inset-0 grid place-items-center text-xs text-white/75">Barevný cover</span>}
          </div>
        </div>
        {canEdit ? <div className="mt-4 flex flex-wrap gap-2">
          <form action={uploadTripCover} className="flex min-w-0 flex-wrap items-center gap-2">
            <input type="hidden" name="tripId" value={trip.id} />
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/60 px-3 text-sm font-medium transition hover:border-primary/35">
              <ImagePlus className="size-4" aria-hidden="true" /> Nahrát obrázek
              <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" required />
            </label>
            <Button type="submit" variant="outline" size="sm">Uložit obrázek</Button>
          </form>
          {trip.cover_kind === "upload" ? <form action={removeTripCover}><input type="hidden" name="tripId" value={trip.id} /><Button type="submit" variant="ghost" size="sm"><Trash2 aria-hidden="true" /> Odstranit obrázek</Button></form> : null}
        </div> : null}
        </section>
      </div>
  );
}

type FieldProps = React.ComponentProps<"input"> & { label: string; name: string };
function Field({ className, label, name, ...props }: FieldProps) {
  return <label className={cn("text-xs font-medium text-muted-foreground", className)}>{label}<input className={controlClassName} name={name} {...props} /></label>;
}

type SelectFieldProps = React.ComponentProps<"select"> & { label: string; name: string };
function SelectField({ children, className, label, name, ...props }: SelectFieldProps) {
  return <label className={cn("text-xs font-medium text-muted-foreground", className)}>{label}<select className={controlClassName} name={name} {...props}>{children}</select></label>;
}

type TextAreaFieldProps = React.ComponentProps<"textarea"> & { label: string; name: string };
function TextAreaField({ className, label, name, ...props }: TextAreaFieldProps) {
  return <label className={cn("text-xs font-medium text-muted-foreground", className)}>{label}<textarea className={cn(controlClassName, "min-h-28 resize-y py-3")} name={name} {...props} /></label>;
}
