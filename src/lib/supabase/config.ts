const DEFAULT_APP_URL = "http://localhost:3000";

function requirePublicEnvironmentVariable(
  name: string,
  value: string | undefined,
) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseConfig() {
  return {
    url: requirePublicEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    publishableKey: requirePublicEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function getAppUrl() {
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL);

  if (appUrl.protocol !== "http:" && appUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use http or https");
  }

  return appUrl;
}
