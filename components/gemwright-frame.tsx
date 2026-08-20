"use client";

import { useCallback } from "react";

export function GemwrightFrame({ src, themeHref }: { src: string; themeHref: string }) {
  const applyTheme = useCallback((frame: HTMLIFrameElement) => {
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || doc.getElementById("table-for-two-illustration-theme")) return;

      const link = doc.createElement("link");
      link.id = "table-for-two-illustration-theme";
      link.rel = "stylesheet";
      link.href = themeHref;
      doc.head.appendChild(link);
    } catch {
      // Same-origin in production; keep the game playable if the frame cannot be styled.
    }
  }, [themeHref]);

  return (
    <iframe
      className="gemwright-frame"
      src={src}
      title="Gemwright game"
      allow="clipboard-write"
      onLoad={(event) => applyTheme(event.currentTarget)}
    />
  );
}
