"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { getSafeTimezone, getTimezoneOption, searchTimezones } from "./timezone-catalog";

type TimezoneComboboxProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  label?: string;
  name: string;
  onValueChange?: (value: string) => void;
};

export function TimezoneCombobox({
  className,
  defaultValue,
  disabled = false,
  label = "Časové pásmo",
  name,
  onValueChange,
}: TimezoneComboboxProps) {
  const fallback = getSafeTimezone(defaultValue);
  const [value, setValue] = useState(fallback);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = inputId + "-options";
  const selected = getTimezoneOption(value) ?? { aliases: [], city: value, id: value, region: "" };
  const results = useMemo(() => searchTimezones(query).slice(0, 80), [query]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function closeOnBlur() {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setQuery("");
      }
    }, 0);
  }

  function choose(nextValue: string) {
    setValue(nextValue);
    setQuery("");
    setOpen(false);
    onValueChange?.(nextValue);
  }

  return (
    <div ref={containerRef} className={cn("relative text-xs font-medium text-muted-foreground", className)}>
      <label htmlFor={inputId}>{label}</label>
      <div className="relative mt-2">
        <input
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-label={label}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-input bg-background/55 px-3 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onBlur={closeOnBlur}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setHighlighted((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlighted((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter" && open && results[highlighted]) {
              event.preventDefault();
              choose(results[highlighted].id);
            }
          }}
          placeholder={selected ? selected.city + " — " + selected.id : "Hledat město nebo timezone"}
          value={open ? query : ""}
        />
        {!open && selected ? <span className="pointer-events-none absolute inset-y-0 left-3 right-10 flex items-center truncate text-sm text-foreground">{selected.city} — {selected.id}</span> : null}
        <ChevronDown className={cn("pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 transition", open && "rotate-180")} aria-hidden="true" />
      </div>
      <input type="hidden" name={name} value={value} />
      {open ? (
        <div id={listId} role="listbox" aria-label={label + " možnosti"} className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)]">
          {results.length ? results.map((option, index) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted/60", index === highlighted && "bg-primary/12")}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.city}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{option.id}</span>
              </span>
              {option.id === value ? <Check className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
            </button>
          )) : <p className="px-3 py-4 text-sm text-muted-foreground">Timezone nebyla nalezena.</p>}
        </div>
      ) : null}
    </div>
  );
}
