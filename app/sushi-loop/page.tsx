"use client";

import Link from "next/link";
import Script from "next/script";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsLeftRight,
  Check,
  Copy,
  ForkKnife,
  LockKey,
  Play,
  SignOut,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SUSHI_HAND_SIZE,
  SUSHI_ROUNDS,
  applySushiAction,
  cardLabel,
  cardRule,
  createSushiGame,
  makiIcons,
  sushiViewFor,
  type SushiAction,
  type SushiCard,
  type SushiGame,
  type SushiKind,
} from "@/lib/sushi-loop";
import type { PeerConnection, PeerData, PeerInstance } from "@/lib/peer-types";

type Role = "host" | "client" | "local" | null;
type Screen = "menu" | "join" | "host" | "client-wait" | "game";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CYCLE_KEY = "table-for-two-sushi-loop-cycle";

function roomCode() {
  return Array.from({ length: 5 }, () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]).join("");
}

function cleanName(value: string, fallback: string) {
  return value.trim().slice(0, 18) || fallback;
}

function nextCycle() {
  const current = Number.parseInt(window.localStorage.getItem(CYCLE_KEY) ?? "0", 10) || 0;
  window.localStorage.setItem(CYCLE_KEY, String(current + 1));
  return current;
}

function connectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("peer-unavailable")) return "No table with that code is open right now.";
  if (message.includes("unavailable-id")) return "That room code is already in use.";
  return "The conveyor lost its signal. Try opening the room again.";
}

export default function SushiLoopPage() {
  const [peerReady, setPeerReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("menu");
  const [role, setRole] = useState<Role>(null);
  const [playerIndex, setPlayerIndex] = useState<0 | 1>(0);
  const [name, setName] = useState("Nadya");
  const [secondName, setSecondName] = useState("Sister");
  const [codeInput, setCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState("");
  const [game, setGame] = useState<SushiGame | null>(null);

  const peerRef = useRef<PeerInstance | null>(null);
  const hostConnectionRef = useRef<PeerConnection | null>(null);
  const clientConnectionRef = useRef<PeerConnection | null>(null);
  const playersRef = useRef<string[]>([]);
  const gameRef = useRef<SushiGame | null>(null);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2100);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const destroyPeer = useCallback(() => {
    hostConnectionRef.current?.close();
    hostConnectionRef.current = null;
    clientConnectionRef.current?.close();
    clientConnectionRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
  }, []);

  useEffect(() => () => destroyPeer(), [destroyPeer]);

  const broadcastGame = useCallback((next: SushiGame) => {
    if (hostConnectionRef.current?.open) {
      hostConnectionRef.current.send({ type: "state", game: sushiViewFor(next, 1) });
    }
  }, []);

  const commitGame = useCallback((next: SushiGame) => {
    gameRef.current = next;
    setGame(next);
    broadcastGame(next);
  }, [broadcastGame]);

  const runAction = useCallback((actor: 0 | 1, action: SushiAction) => {
    const current = gameRef.current;
    if (!current) return;
    let next = applySushiAction(current, actor, action);
    if (next === current) return;
    if (role === "local" && action.type === "select" && next.phase === "drafting" && next.selected[0] && !next.selected[1]) {
      const botHand = next.hands[1];
      const botCard = botHand[(next.turn * 3 + next.round) % botHand.length];
      if (botCard) next = applySushiAction(next, 1, { type: "select", cardId: botCard.id });
    }
    commitGame(next);
  }, [commitGame, role]);

  const handleHostData = useCallback((connection: PeerConnection, data: PeerData) => {
    if (data.type === "join") {
      if (playersRef.current.length >= 2 || gameRef.current) {
        connection.send({ type: "full" });
        return;
      }
      const guest = cleanName(String(data.name ?? "Sister"), "Sister");
      const nextPlayers = [playersRef.current[0] || cleanName(name, "Nadya"), guest];
      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);
      connection.send({ type: "assign", player: 1 });
      connection.send({ type: "lobby", players: nextPlayers });
      setStatus(`${guest} took the seat across from you.`);
      return;
    }
    if (data.type === "action") runAction(1, data.action as SushiAction);
  }, [name, runAction]);

  const createRoom = useCallback(() => {
    if (!peerReady || !window.Peer) {
      setToast("The room service is still loading.");
      return;
    }
    destroyPeer();
    const code = roomCode();
    const hostName = cleanName(name, "Nadya");
    const peer = new window.Peer(`sushi-loop-${code}`, { debug: 1 });
    peerRef.current = peer;
    setRole("host");
    setPlayerIndex(0);
    setActiveCode(code);
    setPlayers([hostName]);
    playersRef.current = [hostName];
    setStatus("Opening your private table…");
    setScreen("host");
    peer.on("open", () => setStatus("Table is open. Share the code with your sister."));
    peer.on("connection", (connection) => {
      if (hostConnectionRef.current) {
        connection.on("open", () => connection.send({ type: "full" }));
        return;
      }
      hostConnectionRef.current = connection;
      connection.on("data", (data) => handleHostData(connection, data));
      connection.on("close", () => setStatus("Your sister left. The table is still open."));
    });
    peer.on("error", (error) => setStatus(connectionError(error)));
  }, [destroyPeer, handleHostData, name, peerReady]);

  const joinRoom = useCallback(() => {
    if (!peerReady || !window.Peer) {
      setToast("The room service is still loading.");
      return;
    }
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 5) {
      setStatus("Enter the five-character table code.");
      return;
    }
    destroyPeer();
    setRole("client");
    setActiveCode(code);
    setStatus("Looking for that table…");
    setScreen("client-wait");
    const peer = new window.Peer(undefined, { debug: 1 });
    peerRef.current = peer;
    peer.on("open", () => {
      const connection = peer.connect(`sushi-loop-${code}`, { reliable: true });
      clientConnectionRef.current = connection;
      connection.on("open", () => {
        connection.send({ type: "join", name: cleanName(name, "Player 2") });
        setStatus("Connected. Waiting for the host to deal.");
      });
      connection.on("data", (data) => {
        if (data.type === "assign") setPlayerIndex(Number(data.player) as 0 | 1);
        if (data.type === "lobby") setPlayers(data.players as string[]);
        if (data.type === "state") {
          const next = data.game as SushiGame;
          gameRef.current = next;
          setGame(next);
          setScreen("game");
        }
        if (data.type === "full") setStatus("That table already has two players.");
      });
      connection.on("close", () => setStatus("The host closed this table."));
    });
    peer.on("error", (error) => setStatus(connectionError(error)));
  }, [codeInput, destroyPeer, name, peerReady]);

  const startOnline = useCallback(() => {
    if (playersRef.current.length < 2) {
      setToast("Wait for your sister to join first.");
      return;
    }
    const next = createSushiGame(playersRef.current[0], playersRef.current[1], nextCycle());
    gameRef.current = next;
    setGame(next);
    setScreen("game");
    broadcastGame(next);
  }, [broadcastGame]);

  const startPractice = useCallback(() => {
    destroyPeer();
    const next = createSushiGame(cleanName(name, "Nadya"), cleanName(secondName, "Sister"), nextCycle());
    setRole("local");
    setPlayerIndex(0);
    setActiveCode("");
    gameRef.current = next;
    setGame(next);
    setScreen("game");
  }, [destroyPeer, name, secondName]);

  const perform = useCallback((action: SushiAction) => {
    if (role === "client") {
      clientConnectionRef.current?.send({ type: "action", action });
      return;
    }
    runAction(0, action);
  }, [role, runAction]);

  const restart = useCallback(() => {
    const current = gameRef.current;
    if (!current || role === "client") return;
    commitGame(createSushiGame(current.players[0], current.players[1], nextCycle()));
  }, [commitGame, role]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(activeCode);
    setToast("Table code copied.");
  }, [activeCode]);

  const exit = useCallback(() => {
    destroyPeer();
    setGame(null);
    gameRef.current = null;
    setPlayers([]);
    playersRef.current = [];
    setStatus("");
    setRole(null);
    setScreen("menu");
  }, [destroyPeer]);

  return (
    <main className="sl-page">
      <Script src="https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js" strategy="afterInteractive" onLoad={() => setPeerReady(true)} />
      <AnimatePresence>{toast && <motion.div className="sl-toast" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{toast}</motion.div>}</AnimatePresence>
      {screen !== "game" && <SushiLobby {...{ screen, name, secondName, codeInput, activeCode, players, status, peerReady, setName, setSecondName, setCodeInput, setScreen, createRoom, joinRoom, startOnline, startPractice, copyCode, exit }} />}
      {screen === "game" && game && <SushiTable game={game} role={role} perspective={playerIndex} roomCode={activeCode} onAction={perform} onRestart={restart} onExit={exit} />}
    </main>
  );
}

type LobbyProps = {
  screen: Screen; name: string; secondName: string; codeInput: string; activeCode: string;
  players: string[]; status: string; peerReady: boolean;
  setName(value: string): void; setSecondName(value: string): void; setCodeInput(value: string): void; setScreen(value: Screen): void;
  createRoom(): void; joinRoom(): void; startOnline(): void; startPractice(): void; copyCode(): void; exit(): void;
};

function SushiLobby(props: LobbyProps) {
  const waiting = props.screen === "host" || props.screen === "client-wait";
  return (
    <div className="sl-lobby-shell">
      <header className="sl-nav"><Link href="/"><ArrowLeft /> Game shelf</Link><span><ForkKnife weight="duotone" /> SUSHI LOOP</span></header>
      <section className="sl-lobby-card">
        {!waiting && <>
          <div className="sl-brand-art" aria-hidden><i /><i /><i /><span>3</span></div>
          <div className="sl-eyebrow"><ArrowsLeftRight /> Pick · reveal · pass</div>
          <h1>Draft dinner.<br /><span>Serve a win.</span></h1>
          <p>Choose one card in secret. When both players lock in, the picks flip up together and the hands trade sides.</p>
          <label className="sl-field"><span>Your name</span><input value={props.name} maxLength={18} onChange={(event) => props.setName(event.target.value)} placeholder="Nadya" /></label>
          {props.screen === "menu" ? <div className="sl-actions">
            <button className="sl-button primary" disabled={!props.peerReady} onClick={props.createRoom}><LockKey /> Create private table <ArrowRight /></button>
            <button className="sl-button secondary" onClick={() => props.setScreen("join")}><UsersThree /> Join with a code</button>
            <div className="sl-divider"><span>or preview the flow</span></div>
            <label className="sl-field"><span>Table bot name</span><input value={props.secondName} maxLength={18} onChange={(event) => props.setSecondName(event.target.value)} placeholder="Sister" /></label>
            <button className="sl-text-button" onClick={props.startPractice}><Play weight="fill" /> Try a practice draft</button>
          </div> : <div className="sl-actions">
            <label className="sl-field"><span>Table code</span><input className="sl-code-input" value={props.codeInput} maxLength={5} autoFocus onChange={(event) => props.setCodeInput(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && props.joinRoom()} placeholder="MAKI5" /></label>
            <button className="sl-button primary" onClick={props.joinRoom}>Take your seat <ArrowRight /></button>
            <button className="sl-text-button" onClick={() => props.setScreen("menu")}><ArrowLeft /> Back</button>
            {props.status && <p className="sl-status">{props.status}</p>}
          </div>}
        </>}
        {waiting && <div className="sl-waiting">
          <div className="sl-wait-art"><i /><i /><i /></div>
          <div className="sl-eyebrow"><span /> Private table live</div>
          <h1>{props.screen === "host" ? "Save the other seat." : "Seat found."}</h1>
          {props.activeCode && <button className="sl-room-code" onClick={props.copyCode}><span>{props.activeCode}</span><Copy /></button>}
          <p className="sl-status">{props.status}</p>
          <div className="sl-player-list">{[0, 1].map((index) => <div className={props.players[index] ? "joined" : ""} key={index}><span>{props.players[index]?.[0] || "?"}</span><strong>{props.players[index] || "Waiting for player…"}</strong>{props.players[index] && <Check />}</div>)}</div>
          {props.screen === "host" && <button className="sl-button primary" disabled={props.players.length < 2} onClick={props.startOnline}>Deal the first hand <ArrowRight /></button>}
          <button className="sl-text-button" onClick={props.exit}>Close table</button>
        </div>}
      </section>
      <p className="sl-fineprint">Original drafting game · Three rounds · Hidden choices stay private</p>
    </div>
  );
}

const CARD_META: Record<SushiKind, { mark: string; tone: string }> = {
  maki1: { mark: "1", tone: "maki" }, maki2: { mark: "2", tone: "maki" }, maki3: { mark: "3", tone: "maki" },
  tempura: { mark: "✦", tone: "tempura" }, sashimi: { mark: "≈", tone: "sashimi" }, dumpling: { mark: "◒", tone: "dumpling" },
  egg: { mark: "◆", tone: "egg" }, salmon: { mark: "◆", tone: "salmon" }, squid: { mark: "◆", tone: "squid" },
  wasabi: { mark: "W", tone: "wasabi" }, pudding: { mark: "P", tone: "pudding" },
};

function SushiCardView({ card, selected = false, small = false, onClick }: { card: SushiCard; selected?: boolean; small?: boolean; onClick?(): void }) {
  const meta = CARD_META[card.kind];
  return <button type="button" className={`sl-card ${meta.tone} ${selected ? "selected" : ""} ${small ? "small" : ""}`} onClick={onClick} disabled={!onClick}>
    <span className="sl-card-mark">{meta.mark}</span>
    <span className="sl-card-copy"><strong>{cardLabel(card.kind)}</strong><small>{cardRule(card.kind)}</small></span>
    {card.kind.startsWith("maki") && <span className="sl-maki-dots">{Array.from({ length: makiIcons(card.kind) }, (_, index) => <i key={index} />)}</span>}
    {selected && <span className="sl-lock-label"><Check /> Locked</span>}
  </button>;
}

function SushiTable({ game, role, perspective, roomCode, onAction, onRestart, onExit }: { game: SushiGame; role: Role; perspective: 0 | 1; roomCode: string; onAction(action: SushiAction): void; onRestart(): void; onExit(): void }) {
  const myHand = game.hands[perspective];
  const opponent = perspective === 0 ? 1 : 0;
  const myLocked = Boolean(game.selected[perspective]);
  const opponentLocked = Boolean(game.selected[opponent]);

  return <div className="sl-table-shell">
    {game.phase === "drafting" && !myLocked && <div className="sl-turn-flash" key={`${game.round}-${game.turn}`}><span>YOUR PICK</span><strong>Choose one. Keep it secret.</strong></div>}
    <header className="sl-table-nav"><button className="sl-icon-button" onClick={onExit} aria-label="Leave game"><SignOut /></button><div><ForkKnife weight="duotone" /><strong>Sushi Loop</strong><span>{roomCode || "Practice draft"}</span></div><small><i /> {role === "local" ? "Table bot" : "Live room"}</small></header>
    <main className="sl-table-grid">
      <section className="sl-opponent-zone">
        <div className="sl-player-heading"><div><span>{game.players[opponent]?.[0]}</span><p><small>Across the table</small><strong>{game.players[opponent]}</strong></p></div><strong>{game.scores[opponent]} pts</strong></div>
        <div className="sl-hidden-hand" aria-label={`${myHand.length} hidden cards`}><div>{Array.from({ length: myHand.length }, (_, index) => <i key={index} style={{ "--card-index": index } as React.CSSProperties} />)}</div><span>{opponentLocked ? <><Check /> Pick locked</> : <>Choosing from {myHand.length} cards…</>}</span></div>
        <Tableau cards={game.tableaus[opponent]} />
      </section>

      <section className="sl-center-zone">
        <div className="sl-round-line"><span>Round {game.round} / {SUSHI_ROUNDS}</span><strong>{game.phase === "drafting" ? `Pick ${Math.min(game.turn, SUSHI_HAND_SIZE)} of ${SUSHI_HAND_SIZE}` : game.phase === "round-score" ? "Round scored" : "Dinner is done"}</strong></div>
        <AnimatePresence mode="wait">
          {game.phase === "drafting" ? <motion.div className="sl-conveyor" key={`draft-${game.round}-${game.turn}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22, ease: [0.23, 1, 0.32, 1] }}>
            <div className="sl-belt"><ArrowsLeftRight /><span>Hands pass after both picks are confirmed</span></div>
            <div className="sl-hand">{myHand.map((card) => <SushiCardView card={card} key={card.id} selected={game.selected[perspective] === card.id} onClick={myLocked ? undefined : () => onAction({ type: "select", cardId: card.id })} />)}</div>
            <div className={`sl-lock-status ${myLocked ? "locked" : ""}`}>{myLocked ? <><Check /> Your card is locked. Waiting for {game.players[opponent]}…</> : <>Your hand is private until you confirm a card.</>}</div>
          </motion.div> : <ScoreState game={game} role={role} perspective={perspective} onAction={onAction} onRestart={onRestart} />}
        </AnimatePresence>
      </section>

      <section className="sl-player-zone">
        <div className="sl-player-heading"><div><span>{game.players[perspective]?.[0]}</span><p><small>Your place</small><strong>{game.players[perspective]}</strong></p></div><strong>{game.scores[perspective]} pts</strong></div>
        <Tableau cards={game.tableaus[perspective]} />
      </section>
    </main>
    <AnimatePresence>{game.lastReveal && <motion.div className="sl-live-reveal" key={game.lastReveal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><div><Sparkle weight="duotone" /><span><small>Both picks revealed</small><strong>{game.lastReveal.text}</strong></span></div><div className="sl-reveal-cards">{game.lastReveal.cards.map((card) => <SushiCardView card={card} small key={card.id} />)}</div></motion.div>}</AnimatePresence>
  </div>;
}

function Tableau({ cards }: { cards: SushiCard[] }) {
  return <div className="sl-tableau"><div className="sl-tableau-label"><span>Plate</span><small>{cards.length} cards</small></div><div>{cards.length ? cards.map((card) => <SushiCardView card={card} small key={card.id} />) : <span className="sl-empty-plate">First pick lands here</span>}</div></div>;
}

function ScoreState({ game, role, perspective, onAction, onRestart }: { game: SushiGame; role: Role; perspective: 0 | 1; onAction(action: SushiAction): void; onRestart(): void }) {
  const opponent = perspective === 0 ? 1 : 0;
  const winner = game.scores[0] === game.scores[1] ? null : game.scores[0] > game.scores[1] ? 0 : 1;
  return <motion.section className="sl-score-state" key={game.phase} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>
    <div className="sl-score-icon"><Sparkle weight="duotone" /></div>
    <span>{game.phase === "finished" ? "Three rounds complete" : `Round ${game.round} plated`}</span>
    <h2>{game.phase === "finished" ? winner === null ? "Perfect tie." : `${game.players[winner]} wins dinner.` : "Count the plates."}</h2>
    <div className="sl-score-lines"><div><span>{game.players[perspective]}</span><strong>+{game.lastRoundScores[perspective]} · {game.scores[perspective]} total</strong></div><div><span>{game.players[opponent]}</span><strong>+{game.lastRoundScores[opponent]} · {game.scores[opponent]} total</strong></div></div>
    {game.phase === "round-score" ? <button className="sl-button primary" onClick={() => onAction({ type: "nextRound" })}>Deal round {game.round + 1} <ArrowRight /></button> : role !== "client" ? <button className="sl-button primary" onClick={onRestart}>New dinner <ArrowRight /></button> : <small>Waiting for the host to deal again…</small>}
  </motion.section>;
}
