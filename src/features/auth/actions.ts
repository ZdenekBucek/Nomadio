"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeNextPath } from "@/features/auth/redirects";
import { getAppUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const nextPath = getSafeNextPath(formData.get("next")?.toString());
  const requestOrigin = (await headers()).get("origin");
  const callbackUrl = new URL(
    "/auth/callback",
    getSafeRequestOrigin(requestOrigin),
  );
  callbackUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

function getSafeRequestOrigin(origin: string | null) {
  if (!origin) {
    return getAppUrl();
  }

  try {
    const requestOrigin = new URL(origin);

    if (requestOrigin.protocol === "http:" || requestOrigin.protocol === "https:") {
      return requestOrigin;
    }
  } catch {
    // A malformed Origin falls back to the configured application URL.
  }

  return getAppUrl();
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
