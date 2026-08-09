"use client";

import { useEffect, useState } from "react";

const desktopMediaQuery = "(min-width: 640px)";

/** Uses the responsive presentation breakpoint, never device or user-agent detection. */
export function useDesktopPickerPresentation() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia(desktopMediaQuery);
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
