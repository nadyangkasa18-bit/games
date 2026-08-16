# Table for Two — Design direction

## Design read

A private two-player game arcade with Raycast-like precision: dark, fast, ergonomic, and tactile. The interface should feel grown-up and sleek while still making each move satisfying and unmistakable.

- Design variance: 6/10
- Motion intensity: 7/10
- Visual density: 5/10

## Visual system

The arcade uses a near-black neutral base, bright off-white text, and one coral accent. Panels rely on fine borders, controlled translucency, and soft depth rather than heavy glass effects. Geist and Geist Mono create a clear split between expressive headings and game-state labels.

Game-specific colors are reserved for meaningful pieces: Gemwright gem suits and Dealhouse property groups. Coral remains the shared interaction and turn color.

## Interaction grammar

- Hover: small lift, clearer border, no excessive glow.
- Press: subtle scale compression.
- Turn change: a centered alert appears for exactly one second.
- Confirmed move: an action card travels from the acting player toward the other side of the table.
- Live intent: the center feed shows when the other player is considering a card, pricing rent, or selecting payment.
- Board update: cards and tokens animate in their real destination, not only in a toast.

All non-essential motion is disabled when `prefers-reduced-motion` is enabled.

## Accessibility

- Touch targets are at least 44px for primary controls.
- Controls retain native button and link semantics.
- Keyboard focus uses a visible coral outline.
- Game status is communicated with text in addition to color.
- Opponent hands remain visually concealed while counts stay visible.
- The layout adapts from a dense desktop table to stacked mobile zones without removing game actions.
