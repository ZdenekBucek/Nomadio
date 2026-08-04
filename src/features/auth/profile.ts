import type { ProfileRow } from "@/lib/supabase/database.types";

export type AuthUserSummary = {
  avatarUrl?: string | null | undefined;
  displayName?: string | null | undefined;
  email?: string | null | undefined;
};

export type ProfileViewModel = {
  avatarUrl: string | null;
  defaultCurrency: string;
  displayName: string;
  email: string;
  initials: string;
  locale: string;
  timezone: string;
};

function getInitials(displayName: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("cs-CZ"))
    .join("");

  return initials || "N";
}

export function getSafeGoogleAvatarUrl(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    const isGoogleHost =
      url.hostname === "googleusercontent.com" ||
      url.hostname.endsWith(".googleusercontent.com");

    return url.protocol === "https:" && isGoogleHost ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getProfileViewModel(
  profile: ProfileRow | null,
  user: AuthUserSummary,
): ProfileViewModel {
  const email = profile?.email ?? user.email ?? "E-mail není dostupný";
  const displayName =
    profile?.display_name ??
    user.displayName ??
    (user.email ? user.email.split("@")[0] : null) ??
    "Cestovatel";
  const avatarUrl = getSafeGoogleAvatarUrl(
    profile?.avatar_url ?? user.avatarUrl,
  );

  return {
    avatarUrl,
    defaultCurrency: profile?.default_currency ?? "CZK",
    displayName,
    email,
    initials: getInitials(displayName),
    locale: profile?.locale ?? "cs-CZ",
    timezone: profile?.timezone ?? "Europe/Prague",
  };
}
