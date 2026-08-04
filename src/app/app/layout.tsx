import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAuthenticatedProfile } from "@/features/auth/session";
import { AppShell } from "@/features/navigation/app-shell";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const auth = await getAuthenticatedProfile();

  if (!auth) {
    redirect("/login?next=/app");
  }

  return <AppShell profile={auth.profile}>{children}</AppShell>;
}
