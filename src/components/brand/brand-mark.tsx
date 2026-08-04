import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
  tagline?: boolean;
};

export function BrandMark({
  className,
  compact = false,
  tagline = false,
}: BrandMarkProps) {
  return (
    <div
      className={cn("inline-flex min-w-0 items-center gap-3", className)}
      aria-label={compact ? "Nomadio" : undefined}
      role={compact ? "img" : undefined}
    >
      <span className="nomadio-mark grid size-10 shrink-0 place-items-center rounded-[0.9rem] text-white">
        <svg
          viewBox="0 0 48 48"
          className="size-7"
          aria-hidden="true"
          fill="none"
        >
          <path
            d="M11.5 35.5v-23l25 23v-23"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 35.5c8.5-.5 16.5-5 21-12.5"
            stroke="#C4B5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="35.5" r="3" fill="#F5F3FF" />
          <circle cx="33" cy="23" r="2.5" fill="#C4B5FD" />
        </svg>
      </span>

      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold tracking-[-0.025em] text-foreground">
            Nomadio
          </span>
          {tagline ? (
            <span className="mt-0.5 block text-[0.58rem] font-medium tracking-[0.24em] text-primary uppercase">
              Plan · Discover · Go
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}
