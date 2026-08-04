import Image from "next/image";

import { getSafeGoogleAvatarUrl } from "@/features/auth/profile";
import type { TripTravelerRow } from "@/lib/supabase/database.types";

import { travelerInitials } from "./trip-presentation";

export function TravelerStack({
  travelers,
  size = "small",
}: {
  travelers: TripTravelerRow[];
  size?: "small" | "large";
}) {
  const visibleTravelers = travelers.slice(0, size === "large" ? 5 : 3);
  const remaining = travelers.length - visibleTravelers.length;
  const avatarClass =
    size === "large"
      ? "size-10 text-[0.68rem]"
      : "size-7 text-[0.58rem]";

  return (
    <div className="flex -space-x-2" aria-label="Cestovatelé">
      {visibleTravelers.map((traveler) => {
        const avatarUrl = getSafeGoogleAvatarUrl(traveler.avatar_url);
        return (
          <span
            key={traveler.id}
            title={traveler.display_name}
            className={`relative grid ${avatarClass} place-items-center overflow-hidden rounded-full border-2 border-card bg-primary/16 font-semibold text-[var(--brand-highlight)]`}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                sizes={size === "large" ? "40px" : "28px"}
                className="object-cover"
              />
            ) : (
              travelerInitials(traveler.display_name)
            )}
            <span className="sr-only">{traveler.display_name}</span>
          </span>
        );
      })}
      {remaining > 0 ? (
        <span
          className={`grid ${avatarClass} place-items-center rounded-full border-2 border-card bg-muted font-semibold text-muted-foreground`}
        >
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}
