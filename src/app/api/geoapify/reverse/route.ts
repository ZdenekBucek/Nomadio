import { NextResponse } from "next/server";
import { GeoapifySearchError, reverseGeocodeGeoapify } from "@/features/places/geoapify";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tripId = url.searchParams.get("tripId")?.trim() ?? "";
  const rawLatitude = url.searchParams.get("latitude")?.trim() ?? "";
  const rawLongitude = url.searchParams.get("longitude")?.trim() ?? "";
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  if (!uuidPattern.test(tripId) || !rawLatitude || !rawLongitude || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const [tripResult, memberResult] = await Promise.all([
    supabase.from("trips").select("id,status").eq("id", tripId).maybeSingle(),
    supabase.from("trip_members").select("role").eq("trip_id", tripId).eq("user_id", auth.user.id).maybeSingle(),
  ]);
  if (tripResult.error || memberResult.error) return NextResponse.json({ error: "data_error" }, { status: 500 });
  if (!tripResult.data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!memberResult.data || !["owner", "editor"].includes(memberResult.data.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (tripResult.data.status === "archived") return NextResponse.json({ error: "archived" }, { status: 409 });

  try {
    const address = await reverseGeocodeGeoapify({ apiKey, latitude, longitude });
    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof GeoapifySearchError && error.kind === "timeout") {
      return NextResponse.json({ error: "provider_timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
