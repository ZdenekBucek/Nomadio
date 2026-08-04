import type {
  TripCoverVariant,
  TripMemberRole,
  TripStatus,
} from "@/lib/supabase/database.types";

export const tripCoverClasses: Record<TripCoverVariant, string> = {
  forest:
    "bg-[radial-gradient(circle_at_72%_16%,rgba(74,222,128,0.34),transparent_38%),radial-gradient(circle_at_20%_80%,rgba(14,116,144,0.38),transparent_44%),linear-gradient(135deg,#10251e,#080d18)]",
  ocean:
    "bg-[radial-gradient(circle_at_76%_18%,rgba(56,189,248,0.4),transparent_40%),radial-gradient(circle_at_18%_76%,rgba(99,102,241,0.4),transparent_44%),linear-gradient(135deg,#0d2138,#080d18)]",
  sunset:
    "bg-[radial-gradient(circle_at_78%_18%,rgba(251,146,60,0.46),transparent_38%),radial-gradient(circle_at_22%_80%,rgba(168,85,247,0.36),transparent_42%),linear-gradient(135deg,#23162a,#090d19)]",
  violet:
    "bg-[radial-gradient(circle_at_75%_20%,rgba(123,97,255,0.48),transparent_42%),radial-gradient(circle_at_18%_82%,rgba(168,85,247,0.24),transparent_44%),linear-gradient(135deg,#111a2c,#080d18)]",
};

export function formatTripDates(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "Termín bude doplněn";

  const formatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const format = (date: string) => formatter.format(new Date(`${date}T00:00:00Z`));

  if (startDate && endDate) return `${format(startDate)} – ${format(endDate)}`;
  return startDate ? `Od ${format(startDate)}` : `Do ${format(endDate!)}`;
}

export function travelerInitials(displayName: string) {
  return (
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toLocaleUpperCase("cs-CZ"))
      .join("") || "C"
  );
}

export function travelerCountLabel(count: number) {
  if (count === 1) return "1 cestovatel";
  if (count >= 2 && count <= 4) return `${count} cestovatelé`;
  return `${count} cestovatelů`;
}

export function memberCountLabel(count: number) {
  if (count === 1) return "1 člen";
  if (count >= 2 && count <= 4) return `${count} členové`;
  return `${count} členů`;
}

export function memberRoleLabel(role: TripMemberRole) {
  if (role === "editor") return "Editor";
  if (role === "viewer") return "Viewer";
  return "Vlastník";
}

export function tripStatusTone(
  status: TripStatus,
): "brand" | "neutral" | "success" | "warning" {
  if (status === "active" || status === "ready") return "success";
  if (status === "planning") return "brand";
  if (status === "idea") return "warning";
  return "neutral";
}
