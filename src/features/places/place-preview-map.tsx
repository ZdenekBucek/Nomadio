"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

export function PlacePreviewMap({
  accessToken,
  latitude,
  longitude,
}: {
  accessToken: string | null;
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken || !containerRef.current) return;
    let disposed = false;
    let map: import("mapbox-gl").Map | null = null;
    let marker: import("mapbox-gl").Marker | null = null;

    void import("mapbox-gl").then((mapboxgl) => {
      if (disposed || !containerRef.current) return;
      map = new mapboxgl.Map({
        accessToken,
        center: [longitude, latitude],
        container: containerRef.current,
        cooperativeGestures: true,
        style: "mapbox://styles/mapbox/dark-v11",
        zoom: 13,
      });
      marker = new mapboxgl.Marker({ color: "#a78bfa" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    });

    return () => {
      disposed = true;
      marker?.remove();
      map?.remove();
    };
  }, [accessToken, latitude, longitude]);

  if (!accessToken) {
    return <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">Mapový náhled není nakonfigurovaný. Souřadnice vybraného místa se přesto bezpečně uloží.</div>;
  }

  return <div ref={containerRef} aria-label="Mapový náhled vybraného místa" className="min-h-48 overflow-hidden rounded-xl border border-border" />;
}
