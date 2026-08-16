# Gemwright

A browser-based strategy game of gems, cards, patrons, and renown for 2–4 players.

Gemwright can be played online using a shared room code or locally through pass-and-play on a single device. The game is designed as a lightweight, responsive experience that runs directly in the browser.

## How to play

On each turn, choose one action:

- Take up to three different gems.
- Take two gems of the same color when at least four remain in that pile.
- Buy a card using your collected gems.
- Reserve a card for later and take a gold gem when one is available.

Purchased cards provide permanent gem bonuses and may also grant renown. Meet a patron's requirements to claim an additional 3 renown.

The final round begins when a player reaches 15 renown. The player with the most renown wins; ties are broken in favor of the player who purchased fewer cards.

## Play modes

### Online room

1. Enter your name and select **Create online room**.
2. Share the generated room code with the other players.
3. Other players select **Join with room code** and enter the code.
4. Start the game once everyone has joined.

Online rooms use a peer-to-peer connection. The host should keep the game open in a normal browser tab for the duration of the session.

### Pass and play

1. Select **Play on one device**.
2. Choose 2, 3, or 4 players.
3. Enter the player names.
4. Take turns using the same device.

## Running locally

No installation or build step is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For online multiplayer, serve the file over HTTPS or use the deployed Vercel version so the peer-to-peer connection can work reliably.

## Deployment

This project can be deployed as a static site on Vercel:

1. Import this GitHub repository into Vercel.
2. Select **Other** as the framework preset.
3. Leave the build command and output directory blank.
4. Deploy.

The main game file must be named `index.html` so Vercel can serve it at the root URL.

## Project structure

```text
games/
├── index.html   # Complete Gemwright game
└── README.md    # Project documentation
```

Gemwright is currently built as a single self-contained HTML file with its interface, styles, game engine, and multiplayer logic together.

## Technology

- HTML, CSS, and vanilla JavaScript
- PeerJS for peer-to-peer online rooms
- Outfit via Google Fonts
- Vercel for static hosting

## Current status

Early playable build. Game balancing, interface refinements, and multiplayer reliability may continue to evolve.
