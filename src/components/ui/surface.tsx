import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const surfaceVariants = cva("border border-border", {
  variants: {
    depth: {
      panel:
        "rounded-[1.5rem] bg-card/78 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.9)] backdrop-blur-2xl",
      card: "rounded-2xl bg-card/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
      inset: "rounded-xl bg-muted/38",
    },
    interactive: {
      true: "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/45",
      false: "",
    },
  },
  defaultVariants: {
    depth: "card",
    interactive: false,
  },
});

export function Surface({
  className,
  depth,
  interactive,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  return (
    <div
      className={cn(surfaceVariants({ depth, interactive }), className)}
      {...props}
    />
  );
}
