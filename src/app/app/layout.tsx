import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAuthenticatedProfile } from "@/features/auth/session";
import { AppShell } from "@/features/navigation/app-shell";
import { getActiveEditableTrips } from "@/features/quick-expense/active-trips";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const auth = await getAuthenticatedProfile();

  if (!auth) {
    redirect("/login?next=/app");
  }

  const activeTrips = auth.profile.quickExpenseFabEnabled ? await getActiveEditableTrips() : [];
  return <AppShell activeTrips={activeTrips} profile={auth.profile}>{children}</AppShell>;
}
