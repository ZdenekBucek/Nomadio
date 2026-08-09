import { placeCategories } from "@/features/places/categories";
import type { PlaceSearchResult } from "@/features/places/place-search-result";
import { isValidDateTimeLocal } from "@/lib/date-time";
import type { PlaceCategory, TransportBookingStatus, TransportPaymentStatus, TransportType } from "@/lib/supabase/database.types";
import { bookingStatuses, transportPaymentStatuses, transportTypes } from "./transport-model";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;

export type TransportPlaceSelection =
  | { mode: "none" }
  | { mode: "saved"; placeId: string }
  | { category: PlaceCategory; mode: "external"; result: PlaceSearchResult };

export type TransportSegmentInput = {
  arrivalAt: string | null;
  arrivalPlace: TransportPlaceSelection;
  baggage: string | null;
  departureAt: string | null;
  departurePlace: TransportPlaceSelection;
  notes: string | null;
  platform: string | null;
  seat: string | null;
  serviceNumber: string | null;
  terminal: string | null;
};

export type TransportBookingInput = {
  balanceDueDate: string | null;
  bookingReference: string | null;
  currency: string | null;
  notes: string | null;
  paidAmount: number | null;
  paymentStatus: TransportPaymentStatus;
  provider: string | null;
  segments: TransportSegmentInput[];
  status: TransportBookingStatus;
  title: string;
  totalPrice: number | null;
  transportType: TransportType;
};

type Result = { data: TransportBookingInput; success: true } | { success: false };

function text(formData: FormData, key: string) { return formData.get(key)?.toString().trim() ?? ""; }
function optional(formData: FormData, key: string) { return text(formData, key) || null; }

function validSearchResult(value: unknown): value is PlaceSearchResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (result.provider === "geoapify" || result.provider === "mapbox")
    && typeof result.providerPlaceId === "string" && result.providerPlaceId.length > 0 && result.providerPlaceId.length <= 300
    && typeof result.name === "string" && result.name.trim().length > 0 && result.name.trim().length <= 200
    && typeof result.formattedAddress === "string" && result.formattedAddress.length <= 500
    && (result.city === null || typeof result.city === "string")
    && (result.countryCode === null || (typeof result.countryCode === "string" && /^[A-Z]{2}$/.test(result.countryCode)))
    && typeof result.latitude === "number" && Number.isFinite(result.latitude) && result.latitude >= -90 && result.latitude <= 90
    && typeof result.longitude === "number" && Number.isFinite(result.longitude) && result.longitude >= -180 && result.longitude <= 180
    && Array.isArray(result.providerCategories) && result.providerCategories.every((item) => typeof item === "string")
    && placeCategories.includes(result.category as PlaceCategory)
    && typeof result.attribution === "string" && result.attribution.length > 0 && result.attribution.length <= 500;
}

function parsePlace(value: unknown): TransportPlaceSelection | null {
  if (!value || typeof value !== "object") return null;
  const selection = value as Record<string, unknown>;
  if (selection.mode === "none") return { mode: "none" };
  if (selection.mode === "saved" && typeof selection.placeId === "string" && uuidPattern.test(selection.placeId)) {
    return { mode: "saved", placeId: selection.placeId };
  }
  if (selection.mode === "external" && placeCategories.includes(selection.category as PlaceCategory) && validSearchResult(selection.result)) {
    return { category: selection.category as PlaceCategory, mode: "external", result: selection.result };
  }
  return null;
}

function optionalSegmentText(value: unknown, maxLength: number) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maxLength ? normalized : undefined;
}

function parseSegments(value: string): TransportSegmentInput[] | null {
  let raw: unknown;
  try { raw = JSON.parse(value); } catch { return null; }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) return null;
  const parsed: TransportSegmentInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const segment = item as Record<string, unknown>;
    const departurePlace = parsePlace(segment.departurePlace);
    const arrivalPlace = parsePlace(segment.arrivalPlace);
    const departureAt = optionalSegmentText(segment.departureAt, 16);
    const arrivalAt = optionalSegmentText(segment.arrivalAt, 16);
    const serviceNumber = optionalSegmentText(segment.serviceNumber, 80);
    const terminal = optionalSegmentText(segment.terminal, 80);
    const platform = optionalSegmentText(segment.platform, 80);
    const seat = optionalSegmentText(segment.seat, 160);
    const baggage = optionalSegmentText(segment.baggage, 500);
    const notes = optionalSegmentText(segment.notes, 2000);
    if (!departurePlace || !arrivalPlace
      || departureAt === undefined || arrivalAt === undefined || serviceNumber === undefined
      || terminal === undefined || platform === undefined || seat === undefined || baggage === undefined || notes === undefined
      || (departureAt !== null && (!dateTimePattern.test(departureAt) || !isValidDateTimeLocal(departureAt)))
      || (arrivalAt !== null && (!dateTimePattern.test(arrivalAt) || !isValidDateTimeLocal(arrivalAt)))
      || (departureAt !== null && arrivalAt !== null && arrivalAt < departureAt)) return null;
    parsed.push({ arrivalAt, arrivalPlace, baggage, departureAt, departurePlace, notes, platform, seat, serviceNumber, terminal });
  }
  return parsed;
}

export function parseTransportBooking(formData: FormData): Result {
  const title = text(formData, "title");
  const transportType = text(formData, "transportType");
  const status = text(formData, "status");
  const paymentStatus = text(formData, "paymentStatus");
  const provider = optional(formData, "provider");
  const bookingReference = optional(formData, "bookingReference");
  const notes = optional(formData, "notes");
  const totalText = optional(formData, "totalPrice");
  const paidText = optional(formData, "paidAmount");
  const totalPrice = totalText === null ? null : Number(totalText.replace(",", "."));
  const paidAmount = paidText === null ? null : Number(paidText.replace(",", "."));
  const balanceDueDate = optional(formData, "balanceDueDate");
  const currency = optional(formData, "currency")?.toUpperCase() ?? null;
  const segments = parseSegments(text(formData, "segments"));

  if (title.length < 1 || title.length > 160
    || !transportTypes.includes(transportType as TransportType)
    || !bookingStatuses.includes(status as TransportBookingStatus)
    || !transportPaymentStatuses.includes(paymentStatus as TransportPaymentStatus)
    || (provider?.length ?? 0) > 160 || (bookingReference?.length ?? 0) > 160 || (notes?.length ?? 0) > 4000
    || (totalPrice !== null && (!Number.isFinite(totalPrice) || totalPrice < 0))
    || (paidAmount !== null && (!Number.isFinite(paidAmount) || paidAmount < 0))
    || (totalPrice !== null && paidAmount !== null && paidAmount > totalPrice)
    || (balanceDueDate !== null && !datePattern.test(balanceDueDate))
    || (currency !== null && !/^[A-Z]{3}$/.test(currency))
    || (paymentStatus === "unpaid" && paidAmount !== null && paidAmount !== 0)
    || (paymentStatus === "partially_paid" && totalPrice !== null && paidAmount !== null && !(paidAmount > 0 && paidAmount < totalPrice))
    || (paymentStatus === "paid" && totalPrice !== null && paidAmount !== null && paidAmount !== totalPrice)
    || !segments) return { success: false };

  return { success: true, data: {
    balanceDueDate, bookingReference, currency, notes, paidAmount,
    paymentStatus: paymentStatus as TransportPaymentStatus, provider, segments,
    status: status as TransportBookingStatus, title, totalPrice, transportType: transportType as TransportType,
  } };
}
