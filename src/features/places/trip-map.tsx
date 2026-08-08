"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { Crosshair, Layers3, MapPinned, MapPinOff, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import type { PlaceCategory } from "@/lib/supabase/database.types";
import {
  placeCategories,
  placeCategoryLabels,
  placeCategoryLayerLabels,
} from "./categories";
import type { MapPlace, TripMapModel } from "./map-view-model";
import { MapPlaceForm, type DraftCoordinates } from "./map-place-form";
import { removePreviewMarker, updatePreviewMarker } from "./map-preview-marker";

export function TripMap({
  accessToken,
  canEdit,
  model,
  tripId,
}: {
  accessToken: string | null;
  canEdit: boolean;
  model: TripMapModel;
  tripId: string;
}) {
  const availableCategories = placeCategories.filter((category) =>
    model.mapped.some((place) => place.category === category),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const previewMarkerRef = useRef<MapboxMarker | null>(null);
  const pickingRef = useRef(false);
  const markerElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const activeCategoriesRef = useRef(new Set(availableCategories));
  const [activeCategories, setActiveCategories] = useState<PlaceCategory[]>(
    () => [...availableCategories],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => model.mapped[0]?.id ?? null,
  );
  const [draft, setDraft] = useState<DraftCoordinates | null>(null);
  const [picking, setPicking] = useState(false);
  const activeCategorySet = new Set(activeCategories);
  const visiblePlaces = model.mapped.filter((place) =>
    activeCategorySet.has(place.category),
  );
  const selected =
    visiblePlaces.find((place) => place.id === selectedId) ??
    visiblePlaces[0] ??
    null;
  const canRenderMap = Boolean(accessToken);

  useEffect(() => {
    if (!accessToken || !containerRef.current) return;

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
        center: model.mapped[0]
          ? [model.mapped[0].longitude, model.mapped[0].latitude]
          : [14.42, 50.08],
        container,
        cooperativeGestures: true,
        style: "mapbox://styles/mapbox/dark-v11",
        zoom: model.mapped.length ? 11 : 4,
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

      model.mapped.forEach((place, index) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "nomadio-map-pin";
        element.textContent = String(index + 1);
        element.setAttribute("aria-label", `Zobrazit místo ${place.name}`);
        element.setAttribute(
          "aria-pressed",
          String(place.id === model.mapped[0]?.id),
        );
        element.dataset.selected = String(place.id === model.mapped[0]?.id);
        element.hidden = !activeCategoriesRef.current.has(place.category);
        element.addEventListener("click", () => {
          updateMarkerSelection(markerElements, place.id);
          setSelectedId(place.id);
        });
        markerElements.set(place.id, element);

        markers.push(
          new mapboxgl.Marker({ anchor: "bottom", element })
            .setLngLat([place.longitude, place.latitude])
            .addTo(map!),
        );
      });
      markerElementsRef.current = markerElements;
      fitPlaces(
        map,
        model.mapped.filter((place) =>
          activeCategoriesRef.current.has(place.category),
        ),
        false,
      );
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
  }, [accessToken, model.mapped]);

  function applyCategories(nextCategories: PlaceCategory[]) {
    const nextSet = new Set(nextCategories);
    activeCategoriesRef.current = nextSet;
    setActiveCategories(nextCategories);
    updateMarkerVisibility(markerElementsRef.current, model.mapped, nextSet);

    const nextPlaces = model.mapped.filter((place) => nextSet.has(place.category));
    const nextSelected = nextPlaces.find((place) => place.id === selectedId) ?? nextPlaces[0] ?? null;
    setSelectedId(nextSelected?.id ?? null);
    updateMarkerSelection(markerElementsRef.current, nextSelected?.id ?? null);
    fitPlaces(mapRef.current, nextPlaces, true);
  }

  function toggleCategory(category: PlaceCategory) {
    const nextCategories = activeCategorySet.has(category)
      ? activeCategories.filter((candidate) => candidate !== category)
      : [...activeCategories, category];
    applyCategories(nextCategories);
  }

  function focusPlace(place: MapPlace) {
    setSelectedId(place.id);
    updateMarkerSelection(markerElementsRef.current, place.id);
    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      essential: true,
      zoom: 14,
    });
  }

  function togglePicking() {
    const next = !picking;
    pickingRef.current = next;
    setPicking(next);
    if (!next) cancelPicking();
  }

  function cancelPicking() {
    pickingRef.current = false;
    setPicking(false);
    setDraft(null);
    removePreviewMarker(previewMarkerRef);
  }

  function removePreviewAfterSubmit() {
    removePreviewMarker(previewMarkerRef);
  }

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card/70 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              Mapa celé cesty
            </p>
            <h2 className="mt-2 text-xl font-semibold">Uložené body</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Piny vycházejí ze souřadnic uložených u míst.
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {canEdit && accessToken ? <Button className="w-full sm:w-auto" type="button" size="lg" variant={picking ? "secondary" : "default"} aria-pressed={picking} onClick={togglePicking}>{picking ? <X /> : <Plus />}{picking ? "Ukončit výběr" : "Přidat vlastní místo"}</Button> : null}
            {canEdit && !accessToken ? <p role="status" className="max-w-xs rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs leading-5 text-amber-200">Přidání vlastního místa vyžaduje nakonfigurovanou Mapbox mapu.</p> : null}
            <StatusPill className="self-start sm:self-auto">{visiblePlaces.length} z {model.mapped.length} na mapě</StatusPill>
          </div>
        </div>

        <MapLayers
          activeCategories={activeCategorySet}
          model={model}
          onShowAll={() => applyCategories([...availableCategories])}
          onToggle={toggleCategory}
        />

        {canRenderMap ? (
          <div className="relative">
            <div
              ref={containerRef}
              aria-label="Interaktivní mapa uložených míst"
              data-picking={picking}
              className="h-[28rem] w-full bg-muted/25 data-[picking=true]:cursor-crosshair sm:h-[36rem]"
            />
            {picking && !draft ? <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-primary/30 bg-background/90 px-3 py-2 text-center text-xs font-medium text-[var(--brand-highlight)] shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2">Klikněte do mapy a umístěte nový pin</div> : null}
            {visiblePlaces.length === 0 && !picking ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/72 p-6 text-center backdrop-blur-[2px]">
                <div>
                  <Layers3 className="mx-auto size-8 text-primary" />
                  <p className="mt-3 font-semibold">Žádná aktivní vrstva</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Zapněte alespoň jednu kategorii míst.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <MapFallback hasPlaces={model.mapped.length > 0} />
        )}

        {draft ? <MapPlaceForm key={`${draft.latitude}:${draft.longitude}`} draft={draft} onCancel={cancelPicking} onSubmit={removePreviewAfterSubmit} tripId={tripId} /> : selected ? (
          <div className="border-t border-border bg-background/35 p-4 sm:p-5">
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
              Vybrané místo
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{selected.name}</h3>
              <StatusPill>{placeCategoryLabels[selected.category]}</StatusPill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[selected.address, selected.city, selected.countryCode]
                .filter(Boolean)
                .join(" · ") || "Bez adresy"}
            </p>
          </div>
        ) : null}
      </section>

      <aside className="space-y-5">
        <section className="rounded-[1.5rem] border border-border bg-card/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Viditelná místa</h2>
            <StatusPill>{visiblePlaces.length}</StatusPill>
          </div>
          {visiblePlaces.length ? (
            <ol className="mt-4 grid gap-2">
              {visiblePlaces.map((place) => {
                const originalIndex = model.mapped.findIndex(
                  (candidate) => candidate.id === place.id,
                );
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => focusPlace(place)}
                      aria-pressed={selected?.id === place.id}
                      className="flex w-full items-start gap-3 rounded-xl border border-border bg-background/30 p-3 text-left transition hover:border-primary/35 hover:bg-primary/8 aria-pressed:border-primary/45 aria-pressed:bg-primary/12"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-semibold text-[var(--brand-highlight)]">
                        {originalIndex + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {place.name}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {place.city ||
                            place.countryCode ||
                            placeCategoryLayerLabels[place.category]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Zapněte vrstvu s uloženými místy.
            </p>
          )}
        </section>

        {model.withoutCoordinates.length ? (
          <section className="rounded-[1.5rem] border border-border bg-card/70 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MapPinOff className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Bez souřadnic</h2>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              {model.withoutCoordinates.map((place) => (
                <li
                  key={place.id}
                  className="rounded-xl border border-border bg-background/25 px-3 py-2"
                >
                  {place.name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Souřadnice doplníte v itineráři při úpravě místa.
            </p>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function MapLayers({
  activeCategories,
  model,
  onShowAll,
  onToggle,
}: {
  activeCategories: Set<PlaceCategory>;
  model: TripMapModel;
  onShowAll: () => void;
  onToggle: (category: PlaceCategory) => void;
}) {
  const availableCategories = placeCategories.filter((category) =>
    model.mapped.some((place) => place.category === category),
  );
  const allActive = availableCategories.every((category) =>
    activeCategories.has(category),
  );

  return (
    <div className="border-b border-border bg-background/25 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Layers3 className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Vrstvy mapy</h3>
      </div>
      <div role="group" aria-label="Filtrovat místa podle kategorie" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={allActive}
          onClick={onShowAll}
          className="rounded-full border border-border bg-muted/35 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-foreground aria-pressed:border-primary/45 aria-pressed:bg-primary/15 aria-pressed:text-[var(--brand-highlight)]"
        >
          Vše · {model.mapped.length}
        </button>
        {placeCategories.map((category) => {
          const count = model.mapped.filter(
            (place) => place.category === category,
          ).length;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={count > 0 && activeCategories.has(category)}
              aria-label={`${placeCategoryLayerLabels[category]}, ${count} míst`}
              disabled={count === 0}
              onClick={() => onToggle(category)}
              className="rounded-full border border-border bg-muted/35 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 aria-pressed:border-primary/45 aria-pressed:bg-primary/15 aria-pressed:text-[var(--brand-highlight)]"
            >
              {placeCategoryLayerLabels[category]} · {count}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function updateMarkerSelection(
  elements: Map<string, HTMLButtonElement>,
  selectedId: string | null,
) {
  for (const [placeId, element] of elements) {
    const isSelected = placeId === selectedId;
    element.dataset.selected = String(isSelected);
    element.setAttribute("aria-pressed", String(isSelected));
  }
}

function updateMarkerVisibility(
  elements: Map<string, HTMLButtonElement>,
  places: MapPlace[],
  activeCategories: Set<PlaceCategory>,
) {
  for (const place of places) {
    const element = elements.get(place.id);
    if (element) element.hidden = !activeCategories.has(place.category);
  }
}

function fitPlaces(
  map: MapboxMap | null,
  places: MapPlace[],
  animate: boolean,
) {
  if (!map || places.length === 0) return;
  if (places.length === 1) {
    map.flyTo({
      center: [places[0]!.longitude, places[0]!.latitude],
      duration: animate ? 500 : 0,
      essential: true,
      zoom: 12,
    });
    return;
  }

  let west = places[0]!.longitude;
  let east = west;
  let south = places[0]!.latitude;
  let north = south;
  for (const place of places.slice(1)) {
    west = Math.min(west, place.longitude);
    east = Math.max(east, place.longitude);
    south = Math.min(south, place.latitude);
    north = Math.max(north, place.latitude);
  }
  map.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    { duration: animate ? 500 : 0, maxZoom: 14, padding: 64 },
  );
}

function MapFallback({ hasPlaces }: { hasPlaces: boolean }) {
  return (
    <div className="nomadio-map-fallback grid min-h-[28rem] place-items-center p-6 text-center sm:min-h-[36rem]">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
          <MapPinned className="size-7" />
        </span>
        <h3 className="mt-4 text-lg font-semibold">
          {hasPlaces ? "Mapa čeká na připojení Mapboxu" : "Zatím není co zobrazit"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hasPlaces
            ? "Po doplnění veřejného mapového tokenu se zde vykreslí interaktivní mapa. Seznam uložených bodů zůstává dostupný vedle ní."
            : "Uložte první místo se souřadnicemi. Potom se zde automaticky objeví jeho pin."}
        </p>
        {hasPlaces ? (
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--brand-highlight)]">
            <Crosshair className="size-3.5" /> Data bodů jsou připravená
          </p>
        ) : null}
      </div>
    </div>
  );
}
