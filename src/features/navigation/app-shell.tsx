import { LogOut, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import type { ProfileViewModel } from "@/features/auth/profile";
import type { ActiveEditableTrip } from "@/features/quick-expense/active-trips";
import { QuickExpenseFab } from "@/features/quick-expense/quick-expense-fab";

import { AppNavigation } from "./app-navigation";

type AppShellProps = {
  activeTrips?: ActiveEditableTrip[];
  children: ReactNode;
  profile: ProfileViewModel;
};

export function AppShell({ activeTrips = [], children, profile }: AppShellProps) {
  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh min-h-0 flex-col border-r border-border bg-sidebar/82 p-4 backdrop-blur-2xl lg:flex">
        <BrandMark tagline className="px-2 py-2" />

        <div className="mt-7 min-h-0 flex-1 overflow-y-auto pr-1">
          <AppNavigation />
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-3 border-t border-border pt-4">
          <Link href="/app/settings" aria-label="Nastavení účtu" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"><ProfileAvatar profile={profile} size="small" /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{profile.displayName}</p>
            <p className="mt-0.5 truncate text-[0.64rem] text-muted-foreground">
              {profile.email}
            </p>
          </div>
          <Link href="/app/settings" aria-label="Nastavení účtu" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><Settings2 className="size-4" aria-hidden="true" /></Link>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label="Odhlásit"
            >
              <LogOut aria-hidden="true" />
            </Button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-background/78 px-4 backdrop-blur-2xl lg:hidden">
          <BrandMark />
          <Link href="/app/settings" aria-label="Nastavení účtu" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"><ProfileAvatar profile={profile} size="small" /></Link>
        </header>

        <main className="relative min-h-[calc(100dvh-4rem)] overflow-x-clip px-4 py-5 sm:px-6 sm:py-7 lg:min-h-dvh lg:px-8 lg:py-8 xl:px-10">
          <div className="nomadio-ambient" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 rounded-2xl border border-border bg-sidebar/90 p-1.5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl lg:hidden">
        <AppNavigation mobile />
      </div>
      {profile.quickExpenseFabEnabled && activeTrips.length ? <QuickExpenseFab trips={activeTrips} /> : null}
    </div>
  );
}

type ProfileAvatarProps = {
  profile: ProfileViewModel;
  size: "small" | "large";
};

export function ProfileAvatar({ profile, size }: ProfileAvatarProps) {
  const isLarge = size === "large";

  return (
    <span
      className={
        isLarge
          ? "relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-muted text-xl font-semibold text-primary"
          : "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted text-xs font-semibold text-primary"
      }
    >
      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={`Profilová fotografie: ${profile.displayName}`}
          fill
          sizes={isLarge ? "80px" : "36px"}
          className="object-cover"
          priority={isLarge}
        />
      ) : (
        profile.initials
      )}
    </span>
  );
}
