"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { TripRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

import { type TripSettingsActionState, updateTripSettings } from "./settings-actions";

const controlClassName =
  "mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65";

const coverOptions = [
  { className: "from-violet-950 via-indigo-900 to-fuchsia-900", label: "Soumrak", value: "violet" },
  { className: "from-slate-950 via-sky-950 to-cyan-900", label: "Oceán", value: "ocean" },
  { className: "from-slate-950 via-rose-950 to-amber-800", label: "Západ slunce", value: "sunset" },
  { className: "from-slate-950 via-emerald-950 to-teal-900", label: "Les", value: "forest" },
] as const;

const timezoneOptions = [
  "Europe/Prague",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Bangkok",
  "Australia/Sydney",
] as const;

const initialState: TripSettingsActionState = { error: null };

export function TripSettingsForm({ canEdit, trip }: { canEdit: boolean; trip: TripRow }) {
  const [state, formAction, pending] = useActionState(updateTripSettings, initialState);
  const errorMessage = state.error === "dates"
    ? "Datum návratu nesmí být před datem odjezdu."
    : state.error === "invalid"
      ? "Zkontrolujte vyplněné údaje."
      : state.error === "save"
        ? "Změny se nepodařilo uložit. Zkuste to znovu."
        : null;

  return (
    <form action={formAction} className="mt-6 grid gap-5">
      <input type="hidden" name="tripId" value={trip.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Název cesty" name="name" defaultValue={trip.name} maxLength={120} required disabled={!canEdit} className="sm:col-span-2" />
        <TextAreaField label="Krátký popis" name="description" defaultValue={trip.description ?? ""} maxLength={600} disabled={!canEdit} className="sm:col-span-2" />
        <Field label="Od" name="startDate" type="date" defaultValue={trip.start_date ?? ""} disabled={!canEdit} />
        <Field label="Do" name="endDate" type="date" defaultValue={trip.end_date ?? ""} disabled={!canEdit} />
        <Field label="Hlavní měna" name="currency" defaultValue={trip.currency} maxLength={3} pattern="[A-Za-z]{3}" required disabled={!canEdit} />
        <SelectField label="Časové pásmo" name="timezone" defaultValue={trip.timezone} required disabled={!canEdit}>
          {!timezoneOptions.includes(trip.timezone as (typeof timezoneOptions)[number]) ? <option value={trip.timezone}>{trip.timezone}</option> : null}
          {timezoneOptions.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
        </SelectField>
        <SelectField label="Fáze cesty" name="status" defaultValue={trip.status} disabled={!canEdit} className="sm:col-span-2">
          <option value="idea">Nápad</option>
          <option value="planning">Plánuji</option>
          <option value="ready">Připraveno</option>
        </SelectField>
      </div>

      <fieldset disabled={!canEdit}>
        <legend className="text-xs font-medium text-muted-foreground">Barevný cover</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {coverOptions.map((cover) => (
            <label key={cover.value} className="group cursor-pointer has-disabled:cursor-not-allowed">
              <input className="peer sr-only" type="radio" name="coverVariant" value={cover.value} defaultChecked={trip.cover_variant === cover.value} />
              <span className={cn("flex h-20 items-end rounded-xl border border-border bg-gradient-to-br p-2 text-[0.68rem] text-white transition peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/30 peer-disabled:opacity-65", cover.className)}>{cover.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {errorMessage ? <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-sm text-amber-200">{errorMessage}</p> : null}
      {canEdit ? <Button type="submit" size="lg" className="justify-self-start" disabled={pending}><Save aria-hidden="true" />{pending ? "Ukládám…" : "Uložit nastavení"}</Button> : null}
    </form>
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
