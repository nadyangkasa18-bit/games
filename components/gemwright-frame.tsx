"use client";

import { useCallback } from "react";

export function GemwrightFrame({ src, themeHref }: { src: string; themeHref: string }) {
  const applyTheme = useCallback((frame: HTMLIFrameElement) => {
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body) return;

      if (!doc.getElementById("table-for-two-illustration-theme")) {
        const link = doc.createElement("link");
        link.id = "table-for-two-illustration-theme";
        link.rel = "stylesheet";
        link.href = themeHref;
        doc.head.appendChild(link);
      }

      if (!doc.getElementById("gemwright-worktable-art")) {
        const art = doc.createElement("div");
        art.id = "gemwright-worktable-art";
        art.setAttribute("aria-hidden", "true");
        art.innerHTML = `<svg viewBox="0 0 260 180"><path class="gw-ink gw-faint" d="M17 151c40-17 75-16 108-2 38 16 76 14 119-5M31 44c18-13 38-14 59-3m90-14c18-8 35-6 51 5"/><path class="gw-paper" d="M71 128l-8-58 47-26 46 29-11 57z"/><path class="gw-ink" d="M71 128l-8-58 47-26 46 29-11 57zM110 44l-7 57-40-31m40 31 42 29m-42-29 53-28"/><path class="gw-coral" d="M176 81l25 18-8 35-26 12-22-22 8-31z"/><path class="gw-ink" d="M176 81l25 18-8 35-26 12-22-22 8-31zm0 0-3 36-20-24m17 24 20 17"/><path class="gw-tool" d="M40 118l29-45m-21 51 28-44M198 54l22 10-8 13-23-11zM204 74l-18 45"/><path class="gw-spark s1" d="M43 29v16m-8-8h16m-13-5 10 10m0-10L38 42"/><path class="gw-spark s2" d="M218 112v13m-6-6h13"/></svg>`;
        doc.body.appendChild(art);

        const syncMoment = () => {
          const moment = doc.querySelector(".over") ? "win" : doc.querySelector(".modal-bg") ? "action" : doc.querySelector(".gemrow.sel,.tsel .picks:not(:empty)") ? "pick" : doc.querySelector(".turnbar.mine") ? "turn" : "rest";
          doc.body.dataset.gwMoment = moment;
        };
        syncMoment();
        new MutationObserver(syncMoment).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      }
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
