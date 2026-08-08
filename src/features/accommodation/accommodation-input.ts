import {
  accommodationTypes,
  paymentStatuses,
} from "./accommodation-model";
import type {
  AccommodationPaymentStatus,
  AccommodationType,
} from "@/lib/supabase/database.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export type AccommodationInput = {
  accommodationType: AccommodationType;
  balanceDueDate: string | null;
  bookingReference: string | null;
  bookingUrl: string | null;
  breakfastIncluded: boolean | null;
  checkInDate: string;
  checkInTime: string | null;
  checkOutDate: string;
  checkOutTime: string | null;
  currency: string | null;
  guestCount: number | null;
  name: string;
  notes: string | null;
  paidAmount: number | null;
  paymentStatus: AccommodationPaymentStatus;
  placeId: string | null;
  roomType: string | null;
  totalPrice: number | null;
};

type Result = { data: AccommodationInput; success: true } | { success: false };

function text(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

export function parseAccommodation(formData: FormData): Result {
  const name = text(formData, "name");
  const accommodationType = text(formData, "accommodationType");
  const checkInDate = text(formData, "checkInDate");
  const checkOutDate = text(formData, "checkOutDate");
  const checkInTime = optional(formData, "checkInTime");
  const checkOutTime = optional(formData, "checkOutTime");
  const guestText = optional(formData, "guestCount");
  const priceText = optional(formData, "totalPrice");
  const paidText = optional(formData, "paidAmount");
  const guestCount = guestText === null ? null : Number(guestText);
  const totalPrice = priceText === null ? null : Number(priceText.replace(",", "."));
  const paidAmount = paidText === null ? null : Number(paidText.replace(",", "."));
  const roomType = optional(formData, "roomType");
  const bookingReference = optional(formData, "bookingReference");
  const bookingUrl = optional(formData, "bookingUrl");
  const currency = optional(formData, "currency")?.toUpperCase() ?? null;
  const notes = optional(formData, "notes");
  const paymentStatus = text(formData, "paymentStatus");
  const balanceDueDate = optional(formData, "balanceDueDate");
  const placeId = optional(formData, "placeId");
  const breakfast = text(formData, "breakfastIncluded");
  const breakfastIncluded = breakfast === "yes" ? true : breakfast === "no" ? false : null;

  let validUrl = true;
  if (bookingUrl) {
    try {
      const parsed = new URL(bookingUrl);
      validUrl = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      validUrl = false;
    }
  }

  if (
    name.length < 1 || name.length > 160
    || !accommodationTypes.includes(accommodationType as AccommodationType)
    || !datePattern.test(checkInDate) || !datePattern.test(checkOutDate) || checkOutDate <= checkInDate
    || (checkInTime !== null && !timePattern.test(checkInTime))
    || (checkOutTime !== null && !timePattern.test(checkOutTime))
    || (guestCount !== null && (!Number.isInteger(guestCount) || guestCount <= 0))
    || (roomType?.length ?? 0) > 160
    || (bookingReference?.length ?? 0) > 160
    || (bookingUrl?.length ?? 0) > 500 || !validUrl
    || (totalPrice !== null && (!Number.isFinite(totalPrice) || totalPrice < 0))
    || (paidAmount !== null && (!Number.isFinite(paidAmount) || paidAmount < 0))
    || (totalPrice !== null && paidAmount !== null && paidAmount > totalPrice)
    || (balanceDueDate !== null && !datePattern.test(balanceDueDate))
    || (currency !== null && !/^[A-Z]{3}$/.test(currency))
    || !paymentStatuses.includes(paymentStatus as AccommodationPaymentStatus)
    || (paymentStatus === "unpaid" && paidAmount !== null && paidAmount !== 0)
    || (paymentStatus === "partially_paid" && totalPrice !== null && paidAmount !== null && !(paidAmount > 0 && paidAmount < totalPrice))
    || (paymentStatus === "paid" && totalPrice !== null && paidAmount !== null && paidAmount !== totalPrice)
    || (notes?.length ?? 0) > 4000
    || (placeId !== null && !uuidPattern.test(placeId))
  ) return { success: false };

  return {
    success: true,
    data: {
      accommodationType: accommodationType as AccommodationType,
      balanceDueDate,
      bookingReference,
      bookingUrl,
      breakfastIncluded,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      currency,
      guestCount,
      name,
      notes,
      paidAmount,
      paymentStatus: paymentStatus as AccommodationPaymentStatus,
      placeId,
      roomType,
      totalPrice,
    },
  };
}
