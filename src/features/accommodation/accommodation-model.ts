import type {
  AccommodationPaymentStatus,
  AccommodationRow,
  AccommodationType,
  TripPlaceRow,
} from "@/lib/supabase/database.types";

export type AccommodationWithPlace = AccommodationRow & { place: TripPlaceRow | null };

export const accommodationTypes: AccommodationType[] = [
  "hotel", "apartment", "hostel", "guesthouse", "camping", "friends_family", "other",
];

export const accommodationTypeLabels: Record<AccommodationType, string> = {
  apartment: "Apartmán",
  camping: "Kemp",
  friends_family: "U přátel / rodiny",
  guesthouse: "Penzion",
  hostel: "Hostel",
  hotel: "Hotel",
  other: "Jiné",
};

export const paymentStatuses: AccommodationPaymentStatus[] = [
  "unknown", "unpaid", "partially_paid", "paid", "pay_on_site",
];

export const paymentStatusLabels: Record<AccommodationPaymentStatus, string> = {
  partially_paid: "Částečně zaplaceno",
  paid: "Zaplaceno",
  pay_on_site: "Platba na místě",
  unknown: "Neznámý stav",
  unpaid: "Nezaplaceno",
};

const dayMs = 86_400_000;

function dateValue(value: string) {
  return Date.parse(`${value}T00:00:00Z`);
}

export function accommodationNights(checkIn: string, checkOut: string) {
  const start = dateValue(checkIn);
  const end = dateValue(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / dayMs);
}

export function sortAccommodations(items: AccommodationWithPlace[]) {
  return [...items].sort((left, right) =>
    left.check_in_date.localeCompare(right.check_in_date)
    || left.check_out_date.localeCompare(right.check_out_date)
    || left.name.localeCompare(right.name, "cs"),
  );
}

export type AccommodationCoverage = {
  gapNights: number;
  overlapCount: number;
};

export function accommodationCoverage(
  items: Pick<AccommodationRow, "check_in_date" | "check_out_date">[],
  tripStart: string | null,
  tripEnd: string | null,
): AccommodationCoverage {
  if (!tripStart || !tripEnd || dateValue(tripEnd) <= dateValue(tripStart)) {
    return { gapNights: 0, overlapCount: 0 };
  }

  const start = dateValue(tripStart);
  const end = dateValue(tripEnd);
  const intervals = items
    .map((item) => ({
      end: Math.min(dateValue(item.check_out_date), end),
      start: Math.max(dateValue(item.check_in_date), start),
    }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);

  let overlapCount = 0;
  for (let index = 0; index < intervals.length; index += 1) {
    for (let next = index + 1; next < intervals.length; next += 1) {
      if (intervals[next]!.start >= intervals[index]!.end) break;
      overlapCount += 1;
    }
  }

  let coveredUntil = start;
  let gapNights = 0;
  for (const interval of intervals) {
    if (interval.start > coveredUntil) gapNights += Math.round((interval.start - coveredUntil) / dayMs);
    coveredUntil = Math.max(coveredUntil, interval.end);
  }
  if (coveredUntil < end) gapNights += Math.round((end - coveredUntil) / dayMs);
  return { gapNights, overlapCount };
}

export function accommodationSummary(items: AccommodationRow[]) {
  return {
    nights: items.reduce((sum, item) => sum + accommodationNights(item.check_in_date, item.check_out_date), 0),
    pending: items.filter((item) => item.payment_status === "unpaid" || item.payment_status === "partially_paid").length,
    reservations: items.length,
  };
}

export function remainingAccommodationAmount(totalPrice: number | null, paidAmount: number | null) {
  if (totalPrice === null || paidAmount === null) return null;
  const remaining = totalPrice - paidAmount;
  return remaining >= 0 ? Math.round(remaining * 100) / 100 : null;
}

export function deriveAccommodationPaymentStatus(
  totalPrice: number | null,
  paidAmount: number | null,
  currentStatus: AccommodationPaymentStatus,
): AccommodationPaymentStatus {
  if (currentStatus === "pay_on_site" || totalPrice === null || paidAmount === null) return currentStatus;
  const remaining = remainingAccommodationAmount(totalPrice, paidAmount);
  if (remaining === null) return currentStatus;
  if (remaining === 0) return "paid";
  if (totalPrice > 0 && paidAmount === 0) return "unpaid";
  if (paidAmount > 0 && remaining > 0) return "partially_paid";
  return currentStatus;
}
