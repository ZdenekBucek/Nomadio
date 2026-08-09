import { timestampToDateTimeLocal } from "@/lib/date-time";
import type {
  TransportBookingRow,
  TransportBookingStatus,
  TransportPaymentStatus,
  TransportSegmentRow,
  TransportType,
  TripPlaceRow,
} from "@/lib/supabase/database.types";

export type TransportSegmentWithPlaces = TransportSegmentRow & {
  arrivalPlace: TripPlaceRow | null;
  departurePlace: TripPlaceRow | null;
};

export type TransportBookingWithSegments = TransportBookingRow & {
  segments: TransportSegmentWithPlaces[];
};

export const transportTypes: TransportType[] = [
  "flight", "train", "bus", "ferry", "rental_car", "private_car", "taxi_transfer", "other",
];

export const transportTypeLabels: Record<TransportType, string> = {
  bus: "Autobus",
  ferry: "Trajekt",
  flight: "Letadlo",
  other: "Jiná doprava",
  private_car: "Vlastní auto",
  rental_car: "Půjčené auto",
  taxi_transfer: "Taxi / transfer",
  train: "Vlak",
};

export const bookingStatuses: TransportBookingStatus[] = ["planned", "booked", "checked_in", "completed", "cancelled"];
export const bookingStatusLabels: Record<TransportBookingStatus, string> = {
  booked: "Rezervováno",
  cancelled: "Zrušeno",
  checked_in: "Odbaveno",
  completed: "Dokončeno",
  planned: "Plánováno",
};

export const transportPaymentStatuses: TransportPaymentStatus[] = ["unknown", "unpaid", "partially_paid", "paid", "pay_on_site"];
export const transportPaymentStatusLabels: Record<TransportPaymentStatus, string> = {
  partially_paid: "Částečně zaplaceno",
  paid: "Zaplaceno",
  pay_on_site: "Platba na místě",
  unknown: "Neznámý stav",
  unpaid: "Nezaplaceno",
};

export function remainingTransportAmount(totalPrice: number | null, paidAmount: number | null) {
  if (totalPrice === null || paidAmount === null) return null;
  const remaining = totalPrice - paidAmount;
  return remaining >= 0 ? Math.round(remaining * 100) / 100 : null;
}

export function deriveTransportPaymentStatus(
  totalPrice: number | null,
  paidAmount: number | null,
  currentStatus: TransportPaymentStatus,
): TransportPaymentStatus {
  if (currentStatus === "pay_on_site" || totalPrice === null || paidAmount === null) return currentStatus;
  const remaining = remainingTransportAmount(totalPrice, paidAmount);
  if (remaining === null) return currentStatus;
  if (remaining === 0) return "paid";
  if (totalPrice > 0 && paidAmount === 0) return "unpaid";
  if (paidAmount > 0 && remaining > 0) return "partially_paid";
  return currentStatus;
}

export function firstDeparture(item: TransportBookingWithSegments) {
  return item.segments.find((segment) => segment.departure_at)?.departure_at ?? null;
}

export function lastArrival(item: TransportBookingWithSegments) {
  for (let index = item.segments.length - 1; index >= 0; index -= 1) {
    const arrival = item.segments[index]?.arrival_at;
    if (arrival) return arrival;
  }
  return null;
}

export function sortTransportBookings(items: TransportBookingWithSegments[]) {
  return [...items].sort((left, right) => {
    const leftDeparture = firstDeparture(left);
    const rightDeparture = firstDeparture(right);
    if (leftDeparture && rightDeparture) return leftDeparture.localeCompare(rightDeparture) || left.title.localeCompare(right.title, "cs");
    if (leftDeparture) return -1;
    if (rightDeparture) return 1;
    return left.created_at.localeCompare(right.created_at) || left.title.localeCompare(right.title, "cs");
  });
}

export function transportSummary(items: TransportBookingWithSegments[], now = new Date()) {
  const departures = items.flatMap((item) => item.segments)
    .map((segment) => segment.departure_at)
    .filter((value): value is string => Boolean(value))
    .filter((value) => Date.parse(value) >= now.getTime())
    .sort();
  return {
    bookings: items.length,
    nearestMovement: departures[0] ?? null,
    pendingPayments: items.filter((item) => item.payment_status === "unpaid" || item.payment_status === "partially_paid").length,
    segments: items.reduce((sum, item) => sum + item.segments.length, 0),
  };
}

export function dateTimeInputValue(value: string | null, timeZone: string) {
  return timestampToDateTimeLocal(value, timeZone);
}
