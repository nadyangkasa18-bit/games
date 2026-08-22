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

      doc.querySelectorAll<HTMLElement>(".menu-card").forEach((card, index) => {
        if (card.querySelector(".gw-lobby-illustration")) return;
        const scene = doc.createElement("div");
        scene.className = "gw-lobby-illustration";
        scene.setAttribute("aria-hidden", "true");
        scene.dataset.scene = String(index % 4);
        scene.innerHTML = `<svg viewBox="0 0 420 150" role="presentation">
          <path class="gw-sketch gw-faint" d="M24 128c67-14 121-13 174 0 62 16 124 13 197-4M46 31c24-13 47-13 69 0m208-4c20-8 39-6 57 5"/>
          <path class="gw-tray" d="M126 65c32-14 72-14 109 0l-8 58c-29 12-61 12-93 0z"/>
          <path class="gw-sketch" d="M126 65c32 13 73 13 109 0m-101 34c31 10 62 10 93 0"/>
          <path class="gw-gem gw-gem-coral" d="m156 79 14-8 15 8 3 17-18 14-18-14z"/>
          <path class="gw-gem gw-gem-jade" d="m195 82 12-7 13 7 2 15-15 11-15-11z"/>
          <path class="gw-gem gw-gem-blue" d="m172 113 10-6 11 6 2 12-13 10-13-10z"/>
          <path class="gw-sketch" d="m156 79 14 17 15-17m-30 0h30m10 3 12 15 13-15m-25 0h25m-48 31 10 12 11-12m-21 0h21"/>
          <path class="gw-paper-shape" d="m265 48 67 11-9 68-68-13z"/>
          <path class="gw-sketch" d="m275 69 42 7m-45 10 34 6m-37 10 27 5"/>
          <path class="gw-tool-shape" d="m78 39 15 6-29 75-14-6z"/>
          <path class="gw-sketch" d="m79 40 13 5-8 19-13-5zm-15 80-13-6-8 17zM347 58l26 11-6 13-27-11zm8 20-18 49"/>
          <path class="gw-spark s1" d="M112 34v19m-9-9h18m-14-7 11 14m0-14-11 14M241 38v13m-6-6h13"/>
          <circle class="gw-dot" cx="34" cy="77" r="2"/><circle class="gw-dot" cx="378" cy="104" r="2"/><circle class="gw-dot" cx="360" cy="35" r="1.6"/>
        </svg>`;
        const anchor = card.querySelector(".tagline") ?? card.firstElementChild;
        anchor?.insertAdjacentElement("afterend", scene);
      });
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
