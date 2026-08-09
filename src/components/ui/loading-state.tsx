import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LoadingState({ children, className, label = "Načítání…" }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className={cn("nomadio-loading-state motion-reduce:[&_*]:animate-none", className)} role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
