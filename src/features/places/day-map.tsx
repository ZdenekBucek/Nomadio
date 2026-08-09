"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { Crosshair, MapPinned, MapPinOff, Plus, Route, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  Map as MapboxMap,
  Marker as MapboxMarker,
} from "mapbox-gl";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { placeCategoryLabels } from "./categories";
import type { DayMapModel } from "./day-map-view-model";
import { MapPlaceForm, type DraftCoordinates } from "./map-place-form";
import { removePreviewMarker, updatePreviewMarker } from "./map-preview-marker";

const itemTypeLabels = {
  activity: "Aktivita",
  note: "Poznámka",
  transport: "Přesun",
} as const;

export function DayMap({
  accessToken,
  canEdit,
  dayId,
  mapPickRequest = 0,
  model,
  onSelectItem,
  selectedItemId: controlledSelectedItemId,
  tripId,
}: {
  accessToken: string | null;
  canEdit: boolean;
  dayId: string;
  mapPickRequest?: number;
  model: DayMapModel;
  onSelectItem?: (itemId: string) => void;
  selectedItemId?: string | null;
  tripId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const previewMarkerRef = useRef<MapboxMarker | null>(null);
  const pickingRef = useRef(false);
  const markerElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const [internalSelectedItemId, setInternalSelectedItemId] = useState<string | null>(
    () => model.points[0]?.itemId ?? null,
  );
  const selectedItemId = controlledSelectedItemId ?? internalSelectedItemId;
  const selectedItemIdRef = useRef(selectedItemId);
  const controlledSelectedItemIdRef = useRef(controlledSelectedItemId);
  const onSelectItemRef = useRef(onSelectItem);
  const [draft, setDraft] = useState<DraftCoordinates | null>(null);
  const [picking, setPicking] = useState(false);
  const [continueToItinerary, setContinueToItinerary] = useState(false);
  const selected = selectedItemId ? model.points.find((point) => point.itemId === selectedItemId) ?? null : model.points[0] ?? null;
  const canRenderMap = Boolean(accessToken);

  useEffect(() => {
    selectedItemIdRef.current = selectedItemId;
    controlledSelectedItemIdRef.current = controlledSelectedItemId;
    onSelectItemRef.current = onSelectItem;
  }, [controlledSelectedItemId, onSelectItem, selectedItemId]);

  useEffect(() => {
    if (!accessToken || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    container.replaceChildren();
    let cancelled = false;
    let map: MapboxMap | null = null;
    const markers: MapboxMarker[] = [];
    const markerElements = new Map<string, HTMLButtonElement>();

    void import("mapbox-gl").then((mapboxgl) => {
      if (cancelled) return;

      map = new mapboxgl.Map({
        accessToken,
        center: model.points[0]
          ? [model.points[0].longitude, model.points[0].latitude]
          : [14.42, 50.08],
        container,
        cooperativeGestures: true,
        style: "mapbox://styles/mapbox/dark-v11",
        zoom: model.points.length ? 12 : 4,
      });
      mapRef.current = map;
      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: true }),
        "top-right",
      );
      map.on("click", (event) => {
        if (!pickingRef.current || !map) return;
        const next = { latitude: event.lngLat.lat, longitude: event.lngLat.lng };
        if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude)) return;
        setDraft(next);
        previewMarkerRef.current = updatePreviewMarker({
          current: previewMarkerRef.current,
          latitude: next.latitude,
          longitude: next.longitude,
          map,
          mapboxgl,
        });
      });

      const bounds = new mapboxgl.LngLatBounds();
      for (const point of model.points) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "nomadio-map-pin nomadio-day-map-pin";
        element.textContent = String(point.sequence);
        element.setAttribute("aria-label", `Zobrazit bod ${point.itemTitle}`);
        const initiallySelected = point.itemId === model.points[0]?.itemId;
        element.dataset.selected = String(initiallySelected);
        element.setAttribute("aria-pressed", String(initiallySelected));
        element.addEventListener("click", () => {
          if (controlledSelectedItemIdRef.current === undefined) setInternalSelectedItemId(point.itemId);
          onSelectItemRef.current?.(point.itemId);
        });
        markerElements.set(point.itemId, element);

        const marker = new mapboxgl.Marker({ anchor: "bottom", element })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map);
        markers.push(marker);
        bounds.extend([point.longitude, point.latitude]);
      }
      markerElementsRef.current = markerElements;
      if (selectedItemIdRef.current) updateMarkerSelection(markerElements, selectedItemIdRef.current);

      if (model.points.length > 1) {
        map.fitBounds(bounds, { duration: 0, maxZoom: 14, padding: 56 });
        map.once("load", () => {
          if (cancelled || !map) return;
          map.addSource("day-order", {
            data: {
              geometry: {
                coordinates: model.points.map((point) => [
                  point.longitude,
                  point.latitude,
                ]),
                type: "LineString",
              },
              properties: {},
              type: "Feature",
            },
            type: "geojson",
          });
          map.addLayer({
            id: "day-order",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#a78bfa",
              "line-opacity": 0.72,
              "line-width": 3,
            },
            source: "day-order",
            type: "line",
          });
        });
      }
    });

    return () => {
      cancelled = true;
      for (const marker of markers) marker.remove();
      markerElements.clear();
      if (markerElementsRef.current === markerElements) {
        markerElementsRef.current = new Map();
      }
      removePreviewMarker(previewMarkerRef);
      map?.remove();
      container.replaceChildren();
      mapRef.current = null;
    };
  }, [accessToken, model.points]);

  useEffect(() => {
    const point = selectedItemId ? model.points.find((candidate) => candidate.itemId === selectedItemId) : null;
    if (!point) return;
    updateMarkerSelection(markerElementsRef.current, point.itemId);
    mapRef.current?.flyTo({
      center: [point.longitude, point.latitude],
      essential: true,
      zoom: 14,
    });
  }, [model.points, selectedItemId]);

  function togglePicking() {
    if (picking) {
      cancelPicking();
      return;
    }
    pickingRef.current = true;
    setContinueToItinerary(false);
    setPicking(true);
  }

  useEffect(() => {
    if (!mapPickRequest || !canEdit || !accessToken || pickingRef.current) return;
    pickingRef.current = true;
    setContinueToItinerary(true);
    setPicking(true);
  }, [accessToken, canEdit, mapPickRequest]);

  function cancelPicking() {
    pickingRef.current = false;
    setPicking(false);
    setContinueToItinerary(false);
    setDraft(null);
    removePreviewMarker(previewMarkerRef);
  }

  function removePreviewAfterSubmit() {
    removePreviewMarker(previewMarkerRef);
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card/70 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Mapa dne
          </p>
          <h2 className="mt-2 text-xl font-semibold">Pořadí zastávek</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Čísla odpovídají pořadí míst v timeline.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canEdit ? <Button type="button" size="sm" variant={picking ? "secondary" : "default"} disabled={!accessToken} aria-pressed={picking} onClick={togglePicking} className="min-h-11 sm:min-h-9">{picking ? <X /> : <Plus />}{picking ? "Ukončit výběr" : "Přidej místo z mapy"}</Button> : null}
          <StatusPill>{model.points.length} na mapě</StatusPill>
        </div>
      </div>

      {canRenderMap ? (
        <div className="relative">
          <div ref={containerRef} aria-label="Interaktivní mapa bodů dne" data-picking={picking} className="h-[22rem] w-full bg-muted/25 data-[picking=true]:cursor-crosshair sm:h-[30rem] xl:h-[34rem]" />
          {picking && !draft ? <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-primary/30 bg-background/90 px-3 py-2 text-center text-xs font-medium text-[var(--brand-highlight)] shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2">Klikněte do mapy a umístěte nový pin</div> : null}
        </div>
      ) : (
        <DayMapFallback hasPoints={model.points.length > 0} />
      )}

      {draft ? <MapPlaceForm key={`${draft.latitude}:${draft.longitude}`} continueToItinerary={continueToItinerary} dayId={dayId} draft={draft} onCancel={cancelPicking} onSubmit={removePreviewAfterSubmit} tripId={tripId} /> : selected ? (
        <div className="border-t border-border bg-background/35 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
              Vybraný bod {selected.sequence}
            </p>
            <a
              href={`#timeline-item-${selected.itemId}`}
              className="text-xs font-medium text-[var(--brand-highlight)] hover:underline"
            >
              Zobrazit v timeline
            </a>
          </div>
          <h3 className="mt-2 font-semibold">{selected.itemTitle}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill tone={selected.itemType === "transport" ? "warning" : "brand"}>
              {itemTypeLabels[selected.itemType]}
            </StatusPill>
            <StatusPill>{placeCategoryLabels[selected.category]}</StatusPill>
            {selected.timeLabel ? <StatusPill>{selected.timeLabel}</StatusPill> : null}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {[selected.placeName, selected.address, selected.city, selected.countryCode]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ) : null}

      {model.withoutCoordinates.length ? (
        <div className="border-t border-border p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <MapPinOff className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">Bez souřadnic</h3>
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {model.withoutCoordinates.map((point) => (
              <li
                key={point.itemId}
                className="rounded-xl border border-border bg-background/25 px-3 py-2"
              >
                <span className="font-medium text-foreground">{point.itemTitle}</span>
                <span className="mt-1 block text-xs">{point.placeName}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.unlinkedItemCount ? (
        <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground sm:px-5">
          {model.unlinkedItemCount} {model.unlinkedItemCount === 1 ? "bod timeline není propojený" : "body timeline nejsou propojené"} s místem.
        </p>
      ) : null}
    </section>
  );
}

function updateMarkerSelection(
  elements: Map<string, HTMLButtonElement>,
  selectedItemId: string,
) {
  for (const [itemId, element] of elements) {
    const isSelected = itemId === selectedItemId;
    element.dataset.selected = String(isSelected);
    element.setAttribute("aria-pressed", String(isSelected));
  }
}

function DayMapFallback({ hasPoints }: { hasPoints: boolean }) {
  return (
    <div className="nomadio-map-fallback grid min-h-[22rem] place-items-center p-6 text-center sm:min-h-[30rem]">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
          {hasPoints ? <Route className="size-7" /> : <MapPinned className="size-7" />}
        </span>
        <h3 className="mt-4 text-lg font-semibold">
          {hasPoints ? "Mapa čeká na připojení Mapboxu" : "Den zatím nemá body na mapě"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hasPoints
            ? "Po doplnění veřejného mapového tokenu se zde zobrazí pořadí zastávek."
            : "Propojte bod timeline s uloženým místem, které má souřadnice."}
        </p>
        {hasPoints ? (
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--brand-highlight)]">
            <Crosshair className="size-3.5" /> Data bodů jsou připravená
          </p>
        ) : null}
      </div>
    </div>
  );
}
