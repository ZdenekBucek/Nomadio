import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

type MapboxMarkerModule = Pick<typeof import("mapbox-gl"), "Marker">;

export function updatePreviewMarker({
  current,
  latitude,
  longitude,
  map,
  mapboxgl,
}: {
  current: MapboxMarker | null;
  latitude: number;
  longitude: number;
  map: MapboxMap | null;
  mapboxgl: MapboxMarkerModule;
}) {
  if (!map || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return current;
  }
  const coordinates: [number, number] = [longitude, latitude];
  if (current) {
    current.setLngLat(coordinates);
    return current;
  }
  const element = document.createElement("div");
  element.className = "nomadio-map-preview-marker";
  element.setAttribute("aria-label", "Náhled nového vlastního místa");
  const pin = document.createElement("div");
  pin.className = "nomadio-map-preview-pin";
  pin.setAttribute("aria-hidden", "true");
  pin.textContent = "+";
  Object.assign(pin.style, {
    alignItems: "center",
    background: "#f59e0b",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "50%",
    boxShadow: "0 0 0 5px rgba(245, 158, 11, 0.24), 0 12px 28px rgba(0, 0, 0, 0.45)",
    color: "#111827",
    display: "flex",
    fontSize: "16px",
    fontWeight: "800",
    height: "24px",
    justifyContent: "center",
    lineHeight: "1",
    pointerEvents: "none",
    position: "relative",
    width: "24px",
  });
  element.append(pin);
  return new mapboxgl.Marker({ anchor: "bottom", element })
    .setLngLat(coordinates)
    .addTo(map);
}

export function removePreviewMarker(markerRef: { current: MapboxMarker | null }) {
  markerRef.current?.remove();
  markerRef.current = null;
}
