import { Crown, Save, Trash2, UserRoundCheck } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { getSafeGoogleAvatarUrl } from "@/features/auth/profile";
import type { TripMemberProfileRow } from "@/lib/supabase/database.types";

import { removeTripMember, updateTripMemberRole } from "./actions";
import { memberRoleLabel, travelerInitials } from "./trip-presentation";

export function TripMembers({
  currentUserId,
  isOwner,
  members,
  tripId,
}: {
  currentUserId: string;
  isOwner: boolean;
  members: TripMemberProfileRow[];
  tripId: string;
}) {
  return (
    <section className="mt-5 min-w-0 border-t border-border pt-5" aria-labelledby="trip-members-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="trip-members-title" className="text-sm font-semibold">
          Členové s přístupem
        </h3>
        <StatusPill tone="neutral">{members.length}</StatusPill>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          const isTripOwner = member.role === "owner";
          const avatarUrl = getSafeGoogleAvatarUrl(member.avatar_url);
          const displayName = member.display_name?.trim() || member.email || "Člen Nomadia";

          return (
            <article
              key={member.user_id}
              className="min-w-0 overflow-hidden rounded-2xl border border-border bg-muted/22 p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/14 text-[0.68rem] font-semibold text-[var(--brand-highlight)]">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    travelerInitials(displayName)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {isCurrentUser ? (
                      <span className="text-[0.62rem] text-[var(--brand-highlight)]">Vy</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
                    {member.email || "E-mail není dostupný"}
                  </p>
                </div>
                <StatusPill tone={isTripOwner ? "brand" : "neutral"}>
                  {isTripOwner ? <Crown className="size-3" aria-hidden="true" /> : null}
                  {memberRoleLabel(member.role)}
                </StatusPill>
              </div>

              {isOwner && !isTripOwner ? (
                <div className="mt-3 grid gap-2 border-t border-border pt-3">
                  <form action={updateTripMemberRole} className="flex gap-2">
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="userId" value={member.user_id} />
                    <label className="sr-only" htmlFor={`member-role-${member.user_id}`}>
                      Role uživatele {displayName}
                    </label>
                    <select
                      id={`member-role-${member.user_id}`}
                      name="role"
                      defaultValue={member.role}
                      className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background/55 px-3 text-xs text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15"
                    >
                      <option value="viewer">Viewer · pouze čtení</option>
                      <option value="editor">Editor · může upravovat</option>
                    </select>
                    <Button type="submit" variant="outline" size="lg">
                      <Save aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Uložit</span>
                    </Button>
                  </form>

                  <details className="rounded-xl border border-destructive/15 bg-destructive/5 px-3 py-2">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-destructive marker:hidden">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Odebrat přístup
                    </summary>
                    <div className="mt-3 border-t border-destructive/15 pt-3">
                      <p className="text-xs leading-5 text-muted-foreground">
                        {displayName} okamžitě ztratí přístup k této cestě. Cestovatelé se tím nemění.
                      </p>
                      <form action={removeTripMember} className="mt-3">
                        <input type="hidden" name="tripId" value={tripId} />
                        <input type="hidden" name="userId" value={member.user_id} />
                        <Button type="submit" variant="destructive" size="lg" className="w-full">
                          <UserRoundCheck aria-hidden="true" /> Potvrdit odebrání
                        </Button>
                      </form>
                    </div>
                  </details>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
