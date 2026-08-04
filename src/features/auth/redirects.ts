const DEFAULT_AUTHENTICATED_PATH = "/app";

export function getSafeNextPath(
  candidate: string | null | undefined,
  fallback = DEFAULT_AUTHENTICATED_PATH,
) {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }

  return candidate;
}
