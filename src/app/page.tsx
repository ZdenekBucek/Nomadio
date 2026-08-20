import { redirect } from "next/navigation";

import { getAuthenticatedProfile } from "@/features/auth/session";

export default async function Home() {
  const auth = await getAuthenticatedProfile();

  redirect(auth ? "/app" : "/login");
}
