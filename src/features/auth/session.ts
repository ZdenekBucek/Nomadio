import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { getProfileViewModel } from "./profile";

export const getAuthenticatedProfile = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    return null;
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();

  return {
    id: userData.user.id,
    profile: getProfileViewModel(profile, {
      avatarUrl:
        userData.user.user_metadata.avatar_url ??
        userData.user.user_metadata.picture,
      displayName:
        userData.user.user_metadata.full_name ??
        userData.user.user_metadata.name,
      email: userData.user.email,
    }),
  };
});
