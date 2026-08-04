"use client";

import { ArrowLeft, ArrowRight, CalendarDays, LockKeyhole, MapPin, Palette, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

import { createTrip } from "./actions";
import { continentLabels, type CountryOption } from "./countries";

const controlClassName =
  "mt-2 h-11 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

const coverOptions = [
  { className: "from-violet-950 via-indigo-900 to-fuchsia-900", label: "Soumrak", value: "violet" },
  { className: "from-slate-950 via-sky-950 to-cyan-900", label: "Oceán", value: "ocean" },
  { className: "from-slate-950 via-rose-950 to-amber-800", label: "Západ slunce", value: "sunset" },
  { className: "from-slate-950 via-emerald-950 to-teal-900", label: "Les", value: "forest" },
] as const;

type TripFormProps = {
  countries: CountryOption[];
  defaultCurrency: string;
  defaultTimezone: string;
};

export function TripForm({ countries, defaultCurrency, defaultTimezone }: TripFormProps) {
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  function nextStep() {
    const controls = formRef.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);

    if (controls && ![...controls].every((control) => control.reportValidity())) {
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  return (
    <Surface depth="panel" className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Nová cesta
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            {step === 1 ? "Kam se vydáte?" : step === 2 ? "Dejte cestě charakter" : "Vše je připravené"}
          </h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]">
          {step === 1 ? <MapPin className="size-5" aria-hidden="true" /> : step === 2 ? <Palette className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
        </span>
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Průběh vytvoření cesty">
        {["Základ", "Vzhled", "Soukromí"].map((label, index) => {
          const itemStep = index + 1;
          return (
            <li key={label} className="min-w-0">
              <div className={cn("h-1 rounded-full", itemStep <= step ? "bg-primary shadow-[0_0_10px_var(--brand-glow)]" : "bg-muted")} />
              <span className={cn("mt-2 block truncate text-[0.65rem]", itemStep === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </li>
          );
        })}
      </ol>

      <form ref={formRef} action={createTrip} className="mt-6">
        <input type="hidden" name="timezone" value={defaultTimezone} />

        <div data-step="1" className={step === 1 ? "grid gap-4" : "hidden"}>
          <Field label="Název cesty" name="name" placeholder="Japonsko 2027" maxLength={120} required />
          <SelectField label="Hlavní země" name="countryCode" defaultValue="" required>
            <option value="" disabled>Vyberte zemi</option>
            {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </SelectField>
          <Field label="První město nebo oblast" name="city" placeholder="Tokio" maxLength={120} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Od" name="startDate" type="date" />
            <Field label="Do" name="endDate" type="date" />
          </div>
          <Field label="Hlavní měna" name="currency" defaultValue={defaultCurrency} maxLength={3} pattern="[A-Za-z]{3}" required />
        </div>

        <div data-step="2" className={step === 2 ? "grid gap-4" : "hidden"}>
          <TextAreaField label="Krátký popis" name="description" placeholder="Co chcete na této cestě zažít?" maxLength={600} />
          <SelectField label="Světadíl" name="continentOverride" defaultValue="">
            <option value="">Automaticky podle země</option>
            {Object.entries(continentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <SelectField label="Fáze cesty" name="status" defaultValue="planning">
            <option value="idea">Nápad</option>
            <option value="planning">Plánuji</option>
          </SelectField>
          <fieldset>
            <legend className="text-xs font-medium text-muted-foreground">Barevný cover</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {coverOptions.map((cover) => (
                <label key={cover.value} className="group cursor-pointer">
                  <input className="peer sr-only" type="radio" name="coverVariant" value={cover.value} defaultChecked={cover.value === "violet"} />
                  <span className={cn("flex h-16 items-end rounded-xl border border-border bg-gradient-to-br p-2 text-[0.68rem] text-white transition peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/30", cover.className)}>{cover.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div data-step="3" className={step === 3 ? "grid gap-4" : "hidden"}>
          <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-[var(--brand-highlight)]"><LockKeyhole className="size-4" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-medium">Jen já</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Cesta vznikne jako soukromá. Cestovatele a členy přidáte později vědomě.</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/25 px-3 py-3 text-xs leading-5 text-muted-foreground">
            Po vytvoření se cesta zobrazí v jednom společném přehledu s vašimi budoucími sdílenými cestami.
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {step > 1 ? <Button type="button" variant="outline" size="lg" onClick={() => setStep((current) => current - 1)}><ArrowLeft aria-hidden="true" /> Zpět</Button> : null}
          {step < 3 ? (
            <Button type="button" size="lg" className="ml-auto" onClick={nextStep}>Pokračovat <ArrowRight aria-hidden="true" /></Button>
          ) : (
            <Button type="submit" size="lg" className="ml-auto flex-1"><CalendarDays aria-hidden="true" /> Vytvořit soukromou cestu</Button>
          )}
        </div>
      </form>
    </Surface>
  );
}

type FieldProps = React.ComponentProps<"input"> & { label: string; name: string };
function Field({ label, name, ...props }: FieldProps) {
  return <label className="text-xs font-medium text-muted-foreground">{label}<input className={controlClassName} name={name} {...props} /></label>;
}

type SelectFieldProps = React.ComponentProps<"select"> & { label: string; name: string };
function SelectField({ children, label, name, ...props }: SelectFieldProps) {
  return <label className="text-xs font-medium text-muted-foreground">{label}<select className={controlClassName} name={name} {...props}>{children}</select></label>;
}

type TextAreaFieldProps = React.ComponentProps<"textarea"> & { label: string; name: string };
function TextAreaField({ label, name, ...props }: TextAreaFieldProps) {
  return <label className="text-xs font-medium text-muted-foreground">{label}<textarea className={cn(controlClassName, "min-h-24 resize-y py-3")} name={name} {...props} /></label>;
}
