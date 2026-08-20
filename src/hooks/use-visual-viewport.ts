"use client";

import { useSyncExternalStore } from "react";

export type VisualViewportMetrics = {
  height: number;
  offsetTop: number;
};

const unavailableSnapshot = () => "";
const noopSubscribe = () => () => undefined;

function getVisualViewportSnapshot() {
  if (typeof window === "undefined" || !window.visualViewport) return "";

  const { height, offsetTop } = window.visualViewport;
  return `${height}:${offsetTop}`;
}

function subscribeToVisualViewport(onStoreChange: () => void) {
  const viewport = window.visualViewport;
  if (!viewport) return () => undefined;

  viewport.addEventListener("resize", onStoreChange);
  viewport.addEventListener("scroll", onStoreChange);

  return () => {
    viewport.removeEventListener("resize", onStoreChange);
    viewport.removeEventListener("scroll", onStoreChange);
  };
}

export function useVisualViewport(enabled: boolean): VisualViewportMetrics | null {
  const snapshot = useSyncExternalStore(
    enabled ? subscribeToVisualViewport : noopSubscribe,
    enabled ? getVisualViewportSnapshot : unavailableSnapshot,
    unavailableSnapshot,
  );

  if (!snapshot) return null;

  const [height, offsetTop] = snapshot.split(":").map(Number);
  if (!Number.isFinite(height) || !Number.isFinite(offsetTop)) return null;

  return { height: height!, offsetTop: offsetTop! };
}
