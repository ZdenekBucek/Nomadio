import { todayInTimeZone } from "@/lib/date-time";
import type { TripMemberRole } from "@/lib/supabase/database.types";

export type ActiveEditableTrip = {
  currency: string;
  endDate: string;
  id: string;
  name: string;
  role: Extract<TripMemberRole, "owner" | "editor">;
  startDate: string;
  today: string;
  timezone: string;
};

type CandidateTrip = {
  currency: string;
  end_date: string | null;
  id: string;
  name: string;
  quick_expense_before_start_enabled: boolean;
  start_date: string | null;
  status: string;
  timezone: string;
};
type CandidateMember = { role: TripMemberRole; trip_id: string; user_id: string };

export function resolveActiveEditableTrips(trips: CandidateTrip[], members: CandidateMember[], userId: string, now = new Date()): ActiveEditableTrip[] {
  const roleByTrip = new Map(members.filter((member) => member.user_id === userId).map((member) => [member.trip_id, member.role] as const));
  return trips.flatMap((trip) => {
    const role = roleByTrip.get(trip.id);
    if (!trip.start_date || !trip.end_date || (role !== "owner" && role !== "editor") || trip.status === "archived") return [];
    const today = todayInTimeZone(trip.timezone, now);
    const activeToday = trip.start_date <= today && today <= trip.end_date;
    const enabledBeforeStart = today < trip.start_date && trip.quick_expense_before_start_enabled;
    if (!activeToday && !enabledBeforeStart) return [];
    return [{ currency: trip.currency, endDate: trip.end_date, id: trip.id, name: trip.name, role, startDate: trip.start_date, today, timezone: trip.timezone }];
  });
}
