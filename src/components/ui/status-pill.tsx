import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] leading-none font-medium",
  {
    variants: {
      tone: {
        brand: "border-primary/30 bg-primary/14 text-[var(--brand-highlight)]",
        neutral: "border-border bg-muted/60 text-muted-foreground",
        success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        danger: "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export function StatusPill({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof statusPillVariants>) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...props} />
  );
}
