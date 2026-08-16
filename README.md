# Table for Two

A small online board-game shelf built for Nadya and her sister. The app currently includes four original browser games with room-code multiplayer and practice modes.

## Games

### Gemwright

A gem-collecting strategy game for 2–4 players. Collect gems, commission development cards, attract patrons, and reach 15 renown.

- Online rooms and 2–4 player pass-and-play
- Animated gem movement and market updates
- Live move summaries shared with every player
- One-second turn alert when control passes to you

### Dealhouse

A fast property-set card game for two players. Complete three districts before your rival while banking cards, charging rent, collecting fees, acquiring properties, and proposing swaps.

- Online two-player rooms and one-device practice
- Host-authoritative synchronized game state
- Live action cards that travel across the table
- Payer-selected cards for rent and fees
- Three moves per turn, seven-card hand limit, and protected completed districts

### Cave Poetry

A fast clue-giving game where the Poet may only use one-syllable words. Flip to either side of a card, score the word or full phrase, or Bonk for −1 and move straight on.

- Private rooms and pass-and-play
- Team names, Clean/Spicy 18+ decks, and 60/90/120-second rounds
- Cycled prompt decks so consecutive games open with different words

### Sushi Loop

A simultaneous two-player drafting game. Pick a card in secret, reveal both confirmed choices together, then trade hands and build the best three-round meal.

- Private room-code play with hidden hands
- Tempura, sashimi, dumpling, nigiri/wasabi, maki, and pudding scoring
- One-second pick prompts and a live dual-card reveal after both players confirm

Both games use original names, copy, card artwork, and visual systems. They are fan-made games and are not affiliated with any commercial board-game publisher.

## Run locally

```bash
npm install
npm run dev -- -H 127.0.0.1
```

Open `http://127.0.0.1:3000`.

## Checks

```bash
npm run lint
npm run test:engine
npm run build
```

## Multiplayer

Multiplayer uses PeerJS peer-to-peer rooms. The host creates a short room code and keeps the game tab open while the other player joins. Game state is controlled by the host and broadcast to the connected players after each legal move.

No paid database or realtime backend is required for this version. Because rooms are peer-to-peer, a game ends if the host closes the tab or loses the connection.

## Deployment later

When the Vercel deployment limit resets:

1. Import this repository as a new or existing Vercel project.
2. Let Vercel detect **Next.js** from `package.json`.
3. Keep the root directory at the repository root.
4. Leave build and output settings at their Next.js defaults.

The app is statically prerendered, while live rooms connect directly between browsers.

## Structure

```text
app/
├── page.tsx                 # Game shelf
├── gemwright/page.tsx      # Gemwright frame
├── dealhouse/               # Dealhouse lobby and game table
├── cave-poetry/             # Cave Poetry lobby and table
└── sushi-loop/              # Sushi Loop lobby and drafting table
components/                 # Shared arcade visuals
lib/
├── dealhouse.ts            # Dealhouse rules engine
├── cave-poetry.ts           # Cave Poetry rules and prompt decks
├── sushi-loop.ts            # Sushi Loop drafting/scoring engine
└── peer-types.ts           # PeerJS browser types
public/gemwright.html       # Preserved and enhanced original Gemwright game
scripts/smoke-engine.mjs    # Dealhouse rules smoke test
```

## Technology

- Next.js 16 and React 19
- TypeScript
- Motion for interface transitions
- Phosphor icons
- PeerJS for room-code multiplayer
- Responsive CSS with reduced-motion support
