"use client";

import Link from "next/link";
import Script from "next/script";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Check,
  Copy,
  EyeSlash,
  Hammer,
  Lightning,
  LockKey,
  Play,
  SignOut,
  Sparkle,
  Timer,
  UsersThree,
  Waveform,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  POETRY_TOTAL_ROUNDS,
  applyPoetryAction,
  createPoetryGame,
  poetryResult,
  type PoetryAction,
  type PoetryGame,
  type PoetryRoundSeconds,
  type PoetrySettings,
  type PoetrySpice,
} from "@/lib/cave-poetry";
import type { PeerConnection, PeerData, PeerInstance } from "@/lib/peer-types";

type Role = "host" | "client" | "local" | null;
type Screen = "menu" | "join" | "host" | "client-wait" | "game";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CYCLE_KEY = "table-for-two-cave-poetry-cycle";

function roomCode() {
  return Array.from(
    { length: 5 },
    () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)],
  ).join("");
}

function cleanName(value: string, fallback: string) {
  return value.trim().slice(0, 18) || fallback;
}

function nextDeckCycle() {
  const current = Number.parseInt(window.localStorage.getItem(CYCLE_KEY) ?? "0", 10) || 0;
  window.localStorage.setItem(CYCLE_KEY, String(current + 1));
  return current;
}

function connectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("peer-unavailable")) return "No room with that code is open right now.";
  if (message.includes("unavailable-id")) return "That room code is already in use.";
  return "The cave lost its signal. Try opening the room again.";
}

export default function CavePoetryPage() {
  const [peerReady, setPeerReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("menu");
  const [role, setRole] = useState<Role>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [name, setName] = useState("Nadya");
  const [secondName, setSecondName] = useState("Sister");
  const [teamNames, setTeamNames] = useState<[string, string]>(["Team Stone", "Team Flame"]);
  const [spice, setSpice] = useState<PoetrySpice>("clean");
  const [roundSeconds, setRoundSeconds] = useState<PoetryRoundSeconds>(90);
  const [codeInput, setCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState("");
  const [game, setGame] = useState<PoetryGame | null>(null);

  const peerRef = useRef<PeerInstance | null>(null);
  const hostConnectionRef = useRef<PeerConnection | null>(null);
  const clientConnectionRef = useRef<PeerConnection | null>(null);
  const playersRef = useRef<string[]>([]);
  const gameRef = useRef<PoetryGame | null>(null);
  const playerIndexRef = useRef(0);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { playerIndexRef.current = playerIndex; }, [playerIndex]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2200);
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

  const broadcast = useCallback((payload: PeerData) => {
    if (hostConnectionRef.current?.open) hostConnectionRef.current.send(payload);
  }, []);

  const commitGame = useCallback((next: PoetryGame) => {
    gameRef.current = next;
    setGame(next);
    if (role === "host") broadcast({ type: "state", game: next });
  }, [broadcast, role]);

  const runAction = useCallback((actor: number, action: PoetryAction) => {
    const current = gameRef.current;
    if (!current) return;
    const next = applyPoetryAction(current, actor, action);
    if (next === current) return;
    gameRef.current = next;
    setGame(next);
    broadcast({ type: "state", game: next });
  }, [broadcast]);

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
      broadcast({ type: "lobby", players: nextPlayers });
      setStatus(`${guest} found the cave. You can start now.`);
      return;
    }
    if (data.type === "action") runAction(1, data.action as PoetryAction);
  }, [broadcast, name, runAction]);

  const createRoom = useCallback(() => {
    if (!peerReady || !window.Peer) {
      setToast("The room service is still loading.");
      return;
    }
    destroyPeer();
    const code = roomCode();
    const hostName = cleanName(name, "Nadya");
    const peer = new window.Peer(`cave-poetry-${code}`, { debug: 1 });
    peerRef.current = peer;
    setRole("host");
    setPlayerIndex(0);
    setActiveCode(code);
    setPlayers([hostName]);
    playersRef.current = [hostName];
    setStatus("Carving out your private cave…");
    setScreen("host");

    peer.on("open", () => setStatus("Room is open. Share the code with your sister."));
    peer.on("connection", (connection) => {
      if (hostConnectionRef.current) {
        connection.on("open", () => connection.send({ type: "full" }));
        return;
      }
      hostConnectionRef.current = connection;
      connection.on("data", (data) => handleHostData(connection, data));
      connection.on("close", () => setStatus("Your sister left. The room is still open."));
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
      setStatus("Enter the five-character room code.");
      return;
    }
    destroyPeer();
    setRole("client");
    setActiveCode(code);
    setStatus("Looking for that cave…");
    setScreen("client-wait");
    const peer = new window.Peer(undefined, { debug: 1 });
    peerRef.current = peer;
    peer.on("open", () => {
      const connection = peer.connect(`cave-poetry-${code}`, { reliable: true });
      clientConnectionRef.current = connection;
      connection.on("open", () => {
        connection.send({ type: "join", name: cleanName(name, "Player 2") });
        setStatus("Connected. Waiting for the host to begin.");
      });
      connection.on("data", (data) => {
        if (data.type === "assign") setPlayerIndex(Number(data.player));
        if (data.type === "lobby") setPlayers(data.players as string[]);
        if (data.type === "state") {
          const next = data.game as PoetryGame;
          gameRef.current = next;
          setGame(next);
          setScreen("game");
        }
        if (data.type === "full") setStatus("That cave already has two players.");
      });
      connection.on("close", () => setStatus("The host closed this cave."));
    });
    peer.on("error", (error) => setStatus(connectionError(error)));
  }, [codeInput, destroyPeer, name, peerReady]);

  const startOnline = useCallback(() => {
    if (playersRef.current.length < 2) {
      setToast("Wait for your sister to join first.");
      return;
    }
    const settings: PoetrySettings = {
      teamNames: [cleanName(teamNames[0], "Team Stone"), cleanName(teamNames[1], "Team Flame")],
      spice,
      roundSeconds,
    };
    const next = createPoetryGame(playersRef.current[0], playersRef.current[1], nextDeckCycle(), settings);
    gameRef.current = next;
    setGame(next);
    setScreen("game");
    broadcast({ type: "state", game: next });
  }, [broadcast, roundSeconds, spice, teamNames]);

  const startPractice = useCallback(() => {
    destroyPeer();
    const next = createPoetryGame(
      cleanName(name, "Nadya"),
      cleanName(secondName, "Sister"),
      nextDeckCycle(),
      {
        teamNames: [cleanName(teamNames[0], "Team Stone"), cleanName(teamNames[1], "Team Flame")],
        spice,
        roundSeconds,
      },
    );
    setRole("local");
    setPlayerIndex(0);
    setActiveCode("");
    gameRef.current = next;
    setGame(next);
    setScreen("game");
  }, [destroyPeer, name, roundSeconds, secondName, spice, teamNames]);

  const perform = useCallback((action: PoetryAction) => {
    const current = gameRef.current;
    if (!current) return;
    if (role === "client") {
      clientConnectionRef.current?.send({ type: "action", action });
      return;
    }
    const actor = role === "local" ? current.poet : playerIndexRef.current;
    runAction(actor, action);
  }, [role, runAction]);

  const restart = useCallback(() => {
    const current = gameRef.current;
    if (!current || role === "client") return;
    const next = createPoetryGame(current.players[0], current.players[1], nextDeckCycle(), current.settings);
    commitGame(next);
  }, [commitGame, role]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(activeCode);
    setToast("Room code copied.");
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
    <main className="cp-page">
      <Script src="https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js" strategy="afterInteractive" onLoad={() => setPeerReady(true)} />
      <AnimatePresence>{toast && <motion.div className="cp-toast" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{toast}</motion.div>}</AnimatePresence>

      {screen !== "game" && (
        <PoetryLobby
          screen={screen}
          name={name}
          secondName={secondName}
          teamNames={teamNames}
          spice={spice}
          roundSeconds={roundSeconds}
          codeInput={codeInput}
          activeCode={activeCode}
          players={players}
          status={status}
          peerReady={peerReady}
          setName={setName}
          setSecondName={setSecondName}
          setTeamNames={setTeamNames}
          setSpice={setSpice}
          setRoundSeconds={setRoundSeconds}
          setCodeInput={setCodeInput}
          setScreen={setScreen}
          createRoom={createRoom}
          joinRoom={joinRoom}
          startOnline={startOnline}
          startPractice={startPractice}
          copyCode={copyCode}
          exit={exit}
        />
      )}

      {screen === "game" && game && (
        <PoetryTable
          game={game}
          role={role}
          perspective={role === "local" ? game.poet : playerIndex}
          roomCode={activeCode}
          onAction={perform}
          onRestart={restart}
          onExit={exit}
        />
      )}
    </main>
  );
}

type LobbyProps = {
  screen: Screen;
  name: string;
  secondName: string;
  teamNames: [string, string];
  spice: PoetrySpice;
  roundSeconds: PoetryRoundSeconds;
  codeInput: string;
  activeCode: string;
  players: string[];
  status: string;
  peerReady: boolean;
  setName(value: string): void;
  setSecondName(value: string): void;
  setTeamNames(value: [string, string]): void;
  setSpice(value: PoetrySpice): void;
  setRoundSeconds(value: PoetryRoundSeconds): void;
  setCodeInput(value: string): void;
  setScreen(value: Screen): void;
  createRoom(): void;
  joinRoom(): void;
  startOnline(): void;
  startPractice(): void;
  copyCode(): void;
  exit(): void;
};

function PoetryLobby(props: LobbyProps) {
  const isWaiting = props.screen === "host" || props.screen === "client-wait";
  return (
    <div className="cp-lobby-shell">
      <div className="cp-cave-lines" aria-hidden><i /><i /><i /><i /></div>
      <header className="cp-nav">
        <Link href="/"><ArrowLeft weight="bold" /> Game shelf</Link>
        <span><Hammer weight="duotone" /> CAVE POETRY</span>
      </header>

      <section className="cp-lobby-card">
        {!isWaiting && (
          <>
            <div className="cp-brand-art" aria-hidden><span>1</span><Waveform weight="duotone" /><span>3</span></div>
            <div className="cp-eyebrow"><Lightning weight="fill" /> One-beat word game</div>
            <h1>Small words.<br /><span>Big brain.</span></h1>
            <p className="cp-lede">Give clues using only one-syllable words. Find the word for 1 point, the full phrase for 3, or take the Bonk.</p>
            <label className="cp-field"><span>Your name</span><input value={props.name} maxLength={18} onChange={(event) => props.setName(event.target.value)} placeholder="Nadya" /></label>

            {props.screen === "menu" && (
              <div className="cp-actions">
                <section className="cp-settings" aria-label="Game settings">
                  <div className="cp-settings-head"><span>Game setup</span><small>Host controls</small></div>
                  <div className="cp-team-fields">
                    <label className="cp-field"><span>Team one</span><input value={props.teamNames[0]} maxLength={18} onChange={(event) => props.setTeamNames([event.target.value, props.teamNames[1]])} placeholder="Team Stone" /></label>
                    <label className="cp-field"><span>Team two</span><input value={props.teamNames[1]} maxLength={18} onChange={(event) => props.setTeamNames([props.teamNames[0], event.target.value])} placeholder="Team Flame" /></label>
                  </div>
                  <div className="cp-setting-row">
                    <div><strong>Word deck</strong><small>Spicy adds 18+ prompts</small></div>
                    <div className="cp-segmented" role="group" aria-label="Word deck">
                      {(["clean", "spicy"] as const).map((value) => <button type="button" key={value} className={props.spice === value ? "active" : ""} aria-pressed={props.spice === value} onClick={() => props.setSpice(value)}>{value === "clean" ? "Clean" : "Spicy 18+"}</button>)}
                    </div>
                  </div>
                  <div className="cp-setting-row">
                    <div><strong>Round time</strong><small>Seconds per Poet</small></div>
                    <div className="cp-segmented" role="group" aria-label="Round duration">
                      {([60, 90, 120] as const).map((value) => <button type="button" key={value} className={props.roundSeconds === value ? "active" : ""} aria-pressed={props.roundSeconds === value} onClick={() => props.setRoundSeconds(value)}>{value}s</button>)}
                    </div>
                  </div>
                </section>
                <button className="cp-button cp-button--primary" onClick={props.createRoom} disabled={!props.peerReady}><LockKey weight="bold" /> Create private room <ArrowRight weight="bold" /></button>
                <button className="cp-button cp-button--secondary" onClick={() => props.setScreen("join")}><UsersThree weight="bold" /> Join with a code</button>
                <div className="cp-divider"><span>or share one screen</span></div>
                <label className="cp-field"><span>Second player</span><input value={props.secondName} maxLength={18} onChange={(event) => props.setSecondName(event.target.value)} placeholder="Sister" /></label>
                <button className="cp-text-button" onClick={props.startPractice}><Play weight="fill" /> Start pass-and-play</button>
              </div>
            )}

            {props.screen === "join" && (
              <div className="cp-actions">
                <label className="cp-field"><span>Room code</span><input className="cp-code-input" value={props.codeInput} maxLength={5} onChange={(event) => props.setCodeInput(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && props.joinRoom()} placeholder="ROCK5" autoFocus /></label>
                <button className="cp-button cp-button--primary" onClick={props.joinRoom}><ArrowRight weight="bold" /> Enter cave</button>
                <button className="cp-text-button" onClick={() => props.setScreen("menu")}><ArrowLeft /> Back</button>
                {props.status && <p className="cp-status">{props.status}</p>}
              </div>
            )}
          </>
        )}

        {isWaiting && (
          <div className="cp-waiting">
            <div className="cp-wait-icon"><span /><Hammer weight="duotone" /></div>
            <div className="cp-eyebrow"><i /> Private cave open</div>
            <h1>{props.screen === "host" ? "Call in your tribe." : "You found the cave."}</h1>
            {props.activeCode && <button className="cp-room-code" onClick={props.copyCode}><span>{props.activeCode}</span><Copy weight="bold" /></button>}
            <p className="cp-status">{props.status}</p>
            <div className="cp-player-list">
              {[0, 1].map((index) => <div key={index} className={props.players[index] ? "joined" : ""}><span>{props.players[index]?.[0] || "?"}</span><strong>{props.players[index] || "Waiting for player…"}</strong>{props.players[index] && <Check weight="bold" />}</div>)}
            </div>
            {props.screen === "host" && <button className="cp-button cp-button--primary" onClick={props.startOnline} disabled={props.players.length < 2}>Start game <ArrowRight weight="bold" /></button>}
            <button className="cp-text-button" onClick={props.exit}>Close cave</button>
          </div>
        )}
      </section>
      <p className="cp-fineprint">Original fan-made adaptation · Two-player cooperative mode · No account needed</p>
    </div>
  );
}

function PoetryTable({ game, role, perspective, roomCode, onAction, onRestart, onExit }: {
  game: PoetryGame;
  role: Role;
  perspective: number;
  roomCode: string;
  onAction(action: PoetryAction): void;
  onRestart(): void;
  onExit(): void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const handledDeadline = useRef<number | null>(null);
  const isPoet = role === "local" || perspective === game.poet;
  const card = game.deck[game.cardIndex];
  const prompt = card[game.side];
  const remaining = game.deadline
    ? Math.min(game.settings.roundSeconds, Math.max(0, Math.ceil((game.deadline - now) / 1000)))
    : game.settings.roundSeconds;
  const progress = (remaining / game.settings.roundSeconds) * 100;

  useEffect(() => {
    if (game.phase !== "playing" || !game.deadline) return;
    const interval = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(interval);
  }, [game.deadline, game.phase]);

  useEffect(() => {
    if (game.phase !== "playing" || !game.deadline || remaining > 0 || !isPoet) return;
    if (handledDeadline.current === game.deadline) return;
    handledDeadline.current = game.deadline;
    onAction({ type: "endRound" });
  }, [game.deadline, game.phase, isPoet, onAction, remaining]);

  return (
    <div className="cp-table-shell">
      <header className="cp-table-nav">
        <button className="cp-icon-button" onClick={onExit} aria-label="Leave game"><SignOut /></button>
        <div className="cp-table-title"><Hammer weight="duotone" /><strong>Cave Poetry</strong><span>{roomCode || "Pass & play"}</span></div>
        <div className="cp-live"><i /> {role === "local" ? "One screen" : "Live room"}</div>
      </header>

      <div className="cp-table-grid">
        <aside className="cp-score-panel">
          <div className="cp-panel-label">Team scores</div>
          <div className="cp-team-scores">
            {game.settings.teamNames.map((team, index) => (
              <div className={index === game.poet && game.phase !== "finished" ? "active" : ""} key={team}>
                <span>{team}</span><strong>{game.teamScores[index]}</strong>
              </div>
            ))}
          </div>
          <span>{game.settings.spice === "spicy" ? "Spicy deck · 18+" : "Clean deck"} · {game.settings.roundSeconds}s</span>
          <div className="cp-round-track">
            {Array.from({ length: POETRY_TOTAL_ROUNDS }, (_, index) => (
              <i key={index} className={index + 1 < game.round || game.phase === "finished" ? "done" : index + 1 === game.round ? "active" : ""}>{index + 1}</i>
            ))}
          </div>
          <div className="cp-role-card active"><span>{game.players[game.poet][0]}</span><div><small>Poet</small><strong>{game.players[game.poet]}</strong></div><Waveform /></div>
          <div className="cp-role-card"><span>{game.players[game.poet === 0 ? 1 : 0][0]}</span><div><small>Guesser</small><strong>{game.players[game.poet === 0 ? 1 : 0]}</strong></div><EyeSlash /></div>
        </aside>

        <main className="cp-play-zone">
          <div className="cp-play-head">
            <div><span>Round {game.round} of {POETRY_TOTAL_ROUNDS}</span><strong>{game.phase === "playing" ? `${game.players[game.poet]} makes word` : "Cave is still"}</strong></div>
            <div className={`cp-timer ${remaining <= 15 ? "urgent" : ""}`} style={{ "--timer-progress": `${progress}%` } as CSSProperties}><Timer /><strong>{remaining}</strong><small>sec</small></div>
          </div>

          <div className="cp-card-stage">
            <AnimatePresence mode="wait">
              {game.phase === "playing" && isPoet ? (
                <motion.article
                  className={`cp-word-card side-${game.side}`}
                  key={`${card.id}-${game.side}`}
                  initial={{ opacity: 0, rotateY: game.side === "front" ? -22 : 22, scale: .97 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, rotateY: game.side === "front" ? 22 : -22, scale: .97 }}
                  transition={{ duration: .24, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="cp-card-top"><span>{game.side} · card {game.cardIndex + 1}</span><button onClick={() => onAction({ type: "flipCard" })}><ArrowsClockwise /> Flip card</button></div>
                  <div className="cp-prompt cp-prompt--one"><small>One point</small><strong>{prompt.one}</strong></div>
                  <div className="cp-card-rule" />
                  <div className="cp-prompt cp-prompt--three"><small>Three points</small><strong>{prompt.three}</strong></div>
                  <div className="cp-card-foot"><Hammer weight="duotone" /><span>ONE BEAT WORDS ONLY</span></div>
                </motion.article>
              ) : game.phase === "playing" ? (
                <motion.div className="cp-hidden-card" key="hidden" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-sound-wave"><i /><i /><i /><i /><i /></div>
                  <EyeSlash weight="duotone" />
                  <h2>Eyes off the card.</h2>
                  <p>{game.players[game.poet]} is giving you one-beat clues. Shout as many guesses as you like.</p>
                </motion.div>
              ) : (
                <RoundState game={game} isPoet={isPoet} role={role} onAction={onAction} onRestart={onRestart} />
              )}
            </AnimatePresence>
          </div>

          <div className="cp-controls">
            <button className="cp-score-button one" disabled={game.phase !== "playing" || !isPoet} onClick={() => onAction({ type: "scoreCard", points: 1 })}><span>+1</span><div><strong>Word found</strong><small>Take the point</small></div></button>
            <button className="cp-score-button three" disabled={game.phase !== "playing" || !isPoet} onClick={() => onAction({ type: "scoreCard", points: 3 })}><span>+3</span><div><strong>Full phrase</strong><small>Big brain move</small></div><Sparkle weight="fill" /></button>
            <button className="cp-bonk-button" disabled={game.phase !== "playing" || !isPoet} onClick={() => onAction({ type: "bonk" })}><Hammer weight="fill" /><div><strong>BONK</strong><small>−1 · next card</small></div></button>
          </div>
        </main>

        <aside className="cp-live-panel">
          <div className="cp-panel-label"><i /> Live cave</div>
          <AnimatePresence mode="wait">
            <motion.div className={`cp-latest ${game.lastMove?.kind || "idle"}`} key={game.lastMove?.id || `${game.phase}-${game.round}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {game.lastMove?.kind === "bonk" ? <Hammer weight="duotone" /> : game.lastMove?.kind === "flip" ? <ArrowsClockwise /> : <Lightning weight="duotone" />}
              <strong>{game.lastMove?.text || (game.phase === "playing" ? "Words are in flight" : "Ready for the next round")}</strong>
              <span>{game.lastMove?.kind === "flip" ? "A new prompt is now face-up." : `Round score ${game.roundScore >= 0 ? "+" : ""}${game.roundScore}`}</span>
            </motion.div>
          </AnimatePresence>
          <div className="cp-mini-rules"><strong>Poet can</strong><p>Use one-syllable words. Speak in full clues. Flip the card for a different option.</p></div>
          <div className="cp-mini-rules danger"><strong>Poet can’t</strong><p>Use gestures, rhymes, initials, translations, or any word shown on the card.</p></div>
        </aside>
      </div>
    </div>
  );
}

function RoundState({ game, isPoet, role, onAction, onRestart }: {
  game: PoetryGame;
  isPoet: boolean;
  role: Role;
  onAction(action: PoetryAction): void;
  onRestart(): void;
}) {
  if (game.phase === "finished") {
    const tied = game.teamScores[0] === game.teamScores[1];
    const winner = game.teamScores[0] > game.teamScores[1] ? game.settings.teamNames[0] : game.settings.teamNames[1];
    return (
      <motion.section className="cp-round-state" key="finished" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="cp-state-icon"><Sparkle weight="duotone" /></div>
        <div className="cp-eyebrow">Six rounds complete</div>
        <h2>{tied ? "Cave calls it even." : `${winner} wins.`}</h2>
        <p><strong>{game.settings.teamNames[0]} {game.teamScores[0]}</strong> · <strong>{game.settings.teamNames[1]} {game.teamScores[1]}</strong><br />{poetryResult(game.score)}. The next game opens with a newly cycled word deck.</p>
        {role !== "client" ? <button className="cp-button cp-button--primary" onClick={onRestart}><ArrowsClockwise /> New words, new game <ArrowRight /></button> : <span className="cp-host-note">Waiting for the host to start a new game…</span>}
      </motion.section>
    );
  }

  if (game.phase === "round-end") {
    return (
      <motion.section className="cp-round-state" key="round-end" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="cp-state-icon"><Timer weight="duotone" /></div>
        <div className="cp-eyebrow">Time. Cave goes quiet.</div>
        <h2>{game.roundScore >= 0 ? "+" : ""}{game.roundScore} for {game.settings.teamNames[game.poet]}.</h2>
        <p>{game.round >= POETRY_TOTAL_ROUNDS ? "Count the marks. Your final result is ready." : `${game.players[game.poet === 0 ? 1 : 0]} becomes the next Poet.`}</p>
        {isPoet ? <button className="cp-button cp-button--primary" onClick={() => onAction({ type: "nextRound" })}>{game.round >= POETRY_TOTAL_ROUNDS ? "See final score" : "Pass the words"} <ArrowRight /></button> : <span className="cp-host-note">Waiting for {game.players[game.poet]}…</span>}
      </motion.section>
    );
  }

  return (
    <motion.section className="cp-round-state" key="ready" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="cp-state-icon"><Waveform weight="duotone" /></div>
      <div className="cp-eyebrow">Round {game.round} · roles set</div>
      <h2>{isPoet ? "You make word." : "You guess word."}</h2>
      <p><strong>{game.players[game.poet]}</strong> plays for <strong>{game.settings.teamNames[game.poet]}</strong>. <strong>{game.players[game.poet === 0 ? 1 : 0]}</strong> guesses. You have {game.settings.roundSeconds} seconds.</p>
      {isPoet ? <button className="cp-button cp-button--primary" onClick={() => onAction({ type: "startRound", now: Date.now() })}><Play weight="fill" /> Start round <ArrowRight /></button> : <span className="cp-host-note">The Poet starts when ready…</span>}
    </motion.section>
  );
}
