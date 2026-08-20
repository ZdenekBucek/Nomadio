import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVisualViewport } from "./use-visual-viewport";

type VisualViewportListener = EventListenerOrEventListenerObject;

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "visualViewport");
});

describe("useVisualViewport", () => {
  it("falls back cleanly when VisualViewport is unavailable", () => {
    const { result } = renderHook(() => useVisualViewport(true));

    expect(result.current).toBeNull();
  });

  it("updates on viewport resize and cleans up its listeners", () => {
    const listeners = new Map<string, Set<VisualViewportListener>>();
    const viewport = {
      height: 780,
      offsetTop: 0,
      addEventListener: vi.fn((type: string, listener: VisualViewportListener) => {
        const registered = listeners.get(type) ?? new Set();
        registered.add(listener);
        listeners.set(type, registered);
      }),
      removeEventListener: vi.fn((type: string, listener: VisualViewportListener) => {
        listeners.get(type)?.delete(listener);
      }),
    };
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });

    const { result, unmount } = renderHook(() => useVisualViewport(true));
    expect(result.current).toEqual({ height: 780, offsetTop: 0 });

    viewport.height = 430;
    viewport.offsetTop = 18;
    act(() => {
      listeners.get("resize")?.forEach((listener) => {
        if (typeof listener === "function") listener(new Event("resize"));
      });
    });
    expect(result.current).toEqual({ height: 430, offsetTop: 18 });

    unmount();
    expect(viewport.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(viewport.removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
