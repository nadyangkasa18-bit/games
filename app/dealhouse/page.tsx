"use client";

import Link from "next/link";
import Script from "next/script";
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  Buildings,
  CardsThree,
  Check,
  Copy,
  HandCoins,
  Lightning,
  LockKey,
  Play,
  SignOut,
  Sparkle,
  Stack,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionCard,
  DealAction,
  DealActivity,
  DealCard,
  DealPlayer,
  DealState,
  GROUP_ORDER,
  GROUPS,
  GroupId,
  applyDealAction,
  bankTotal,
  completedGroups,
  createDealGame,
  groupIsComplete,
  paymentAssets,
  rentFor,
} from "@/lib/dealhouse";
import {
  isDealLobbyWaiting,
  type DealLobbyScreen,
} from "@/lib/dealhouse-lobby";
import type { PeerConnection, PeerData, PeerInstance } from "@/lib/peer-types";

type Role = "host" | "client" | "local" | null;
type Screen = DealLobbyScreen;

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function roomCode() {
  return Array.from({ length: 5 }, () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]).join("");
}

function cleanName(value: string, fallback: string) {
  return value.trim().slice(0, 18) || fallback;
}

function errorText(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("peer-unavailable")) return "No room with that code is open right now.";
  if (message.includes("unavailable-id")) return "That room code is busy. Try creating another room.";
  return "The room connection dropped. Try again from the game shelf.";
}

export default function DealhousePage() {
  const [peerReady, setPeerReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("menu");
  const [role, setRole] = useState<Role>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [name, setName] = useState("Nadya");
  const [sisterName, setSisterName] = useState("Sister");
  const [codeInput, setCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [game, setGame] = useState<DealState | null>(null);
  const [selectedCard, setSelectedCard] = useState<DealCard | null>(null);
  const [toast, setToast] = useState("");
  const [turnFlash, setTurnFlash] = useState(false);
  const [moveBurst, setMoveBurst] = useState<DealActivity | null>(null);

  const peerRef = useRef<PeerInstance | null>(null);
  const hostConnectionsRef = useRef<Array<{ connection: PeerConnection; player: number }>>([]);
  const clientConnectionRef = useRef<PeerConnection | null>(null);
  const gameRef = useRef<DealState | null>(null);
  const lobbyRef = useRef<string[]>([]);
  const lastTurnRef = useRef<number | null>(null);
  const lastActivityRef = useRef<string | null>(null);

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { lobbyRef.current = lobbyPlayers; }, [lobbyPlayers]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const perspective = game ? (role === "local" ? game.currentPlayer : playerIndex) : playerIndex;

  useEffect(() => {
    if (!game) return;
    const turnChanged = lastTurnRef.current !== game.turn;
    lastTurnRef.current = game.turn;
    if (!turnChanged || game.phase === "over") return;
    if (role === "local" || game.currentPlayer === playerIndex) {
      const start = window.setTimeout(() => setTurnFlash(true), 0);
      const end = window.setTimeout(() => setTurnFlash(false), 1000);
      return () => {
        window.clearTimeout(start);
        window.clearTimeout(end);
      };
    }
  }, [game?.turn, game?.currentPlayer, game?.phase, playerIndex, role, game]);

  useEffect(() => {
    const latest = game?.activities[0];
    if (!latest || latest.id === lastActivityRef.current) return;
    lastActivityRef.current = latest.id;
    setMoveBurst(latest);
    const timeout = window.setTimeout(() => setMoveBurst(null), 1450);
    return () => window.clearTimeout(timeout);
  }, [game?.activities, game]);

  const destroyPeer = useCallback(() => {
    hostConnectionsRef.current.forEach(({ connection }) => connection.close());
    hostConnectionsRef.current = [];
    clientConnectionRef.current?.close();
    clientConnectionRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
  }, []);

  useEffect(() => () => destroyPeer(), [destroyPeer]);

  const broadcast = useCallback((payload: PeerData) => {
    hostConnectionsRef.current.forEach(({ connection }) => {
      if (connection.open) connection.send(payload);
    });
  }, []);

  const commitGame = useCallback((next: DealState) => {
    gameRef.current = next;
    setGame(next);
    if (role === "host") broadcast({ type: "state", game: next });
  }, [broadcast, role]);

  const runHostAction = useCallback((actor: number, action: DealAction, reply?: PeerConnection) => {
    const current = gameRef.current;
    if (!current) return;
    const result = applyDealAction(current, actor, action);
    if (!result.ok) {
      if (reply) reply.send({ type: "error", message: result.error });
      else setToast(result.error);
      return;
    }
    gameRef.current = result.state;
    setGame(result.state);
    broadcast({ type: "state", game: result.state });
  }, [broadcast]);

  const perform = useCallback((action: DealAction) => {
    setSelectedCard(null);
    if (!gameRef.current) return;
    if (role === "client") {
      clientConnectionRef.current?.send({ type: "action", action });
      return;
    }
    const actor = role === "local" ? gameRef.current.currentPlayer : playerIndex;
    const result = applyDealAction(gameRef.current, actor, action);
    if (!result.ok) {
      setToast(result.error);
      return;
    }
    commitGame(result.state);
  }, [commitGame, playerIndex, role]);

  const handleHostData = useCallback((connection: PeerConnection, assignedPlayer: number, data: PeerData) => {
    if (data.type === "join") {
      if (lobbyRef.current.length >= 2 || gameRef.current) {
        connection.send({ type: "full" });
        return;
      }
      const joiningName = cleanName(String(data.name ?? "Sister"), "Sister");
      const nextPlayers = [lobbyRef.current[0] || cleanName(name, "Nadya"), joiningName];
      lobbyRef.current = nextPlayers;
      setLobbyPlayers(nextPlayers);
      connection.send({ type: "assign", player: assignedPlayer });
      connection.send({ type: "lobby", players: nextPlayers });
      broadcast({ type: "lobby", players: nextPlayers });
      setStatus(`${joiningName} joined. Ready when you are.`);
      return;
    }
    if (data.type === "action") {
      runHostAction(assignedPlayer, data.action as DealAction, connection);
      return;
    }
  }, [broadcast, name, runHostAction]);

  const createRoom = useCallback(() => {
    if (!peerReady || !window.Peer) {
      setToast("The room service is still loading.");
      return;
    }
    destroyPeer();
    const code = roomCode();
    const hostName = cleanName(name, "Nadya");
    const peer = new window.Peer(`dealhouse-${code}`, { debug: 1 });
    peerRef.current = peer;
    setRole("host");
    setPlayerIndex(0);
    setActiveCode(code);
    setLobbyPlayers([hostName]);
    lobbyRef.current = [hostName];
    setStatus("Opening your private table…");
    setScreen("host");

    peer.on("open", () => setStatus("Room is open. Share the code with your sister."));
    peer.on("connection", (connection) => {
      const assignedPlayer = 1;
      hostConnectionsRef.current.push({ connection, player: assignedPlayer });
      connection.on("data", (data) => handleHostData(connection, assignedPlayer, data));
      connection.on("close", () => setStatus("Your sister disconnected. The room is still open."));
    });
    peer.on("error", (error) => setStatus(errorText(error)));
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
    setStatus("Finding that table…");
    setScreen("client-wait");
    const peer = new window.Peer(undefined, { debug: 1 });
    peerRef.current = peer;
    peer.on("open", () => {
      const connection = peer.connect(`dealhouse-${code}`, { reliable: true });
      clientConnectionRef.current = connection;
      connection.on("open", () => {
        connection.send({ type: "join", name: cleanName(name, "Player 2") });
        setStatus("Connected. Waiting for the host to start.");
      });
      connection.on("data", (data) => {
        if (data.type === "assign") setPlayerIndex(Number(data.player));
        if (data.type === "lobby") setLobbyPlayers(data.players as string[]);
        if (data.type === "state") {
          const next = data.game as DealState;
          gameRef.current = next;
          setGame(next);
          setScreen("game");
        }
        if (data.type === "error") setToast(String(data.message));
        if (data.type === "full") setStatus("That table already has two players.");
      });
      connection.on("close", () => setStatus("The host closed this table."));
    });
    peer.on("error", (error) => setStatus(errorText(error)));
  }, [codeInput, destroyPeer, name, peerReady]);

  const startOnlineGame = useCallback(() => {
    if (lobbyRef.current.length < 2) {
      setToast("Wait for your sister to join first.");
      return;
    }
    const next = createDealGame(lobbyRef.current[0], lobbyRef.current[1]);
    gameRef.current = next;
    setGame(next);
    setScreen("game");
    broadcast({ type: "state", game: next });
  }, [broadcast]);

  const startPractice = useCallback(() => {
    destroyPeer();
    const next = createDealGame(cleanName(name, "Nadya"), cleanName(sisterName, "Sister"));
    setRole("local");
    setPlayerIndex(0);
    setActiveCode("");
    gameRef.current = next;
    setGame(next);
    setScreen("game");
  }, [destroyPeer, name, sisterName]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(activeCode);
    setToast("Room code copied.");
  }, [activeCode]);

  const exitGame = useCallback(() => {
    destroyPeer();
    setGame(null);
    gameRef.current = null;
    setScreen("menu");
    setRole(null);
    setLobbyPlayers([]);
    setStatus("");
    setSelectedCard(null);
    lastTurnRef.current = null;
    lastActivityRef.current = null;
  }, [destroyPeer]);

  return (
    <main className="dh-page">
      <Script src="https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js" strategy="afterInteractive" onLoad={() => setPeerReady(true)} />
      <AnimatePresence>{toast && <motion.div className="dh-toast" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{toast}</motion.div>}</AnimatePresence>
      <AnimatePresence>{turnFlash && game && <TurnFlash name={game.players[perspective].name} />}</AnimatePresence>
      <AnimatePresence>{moveBurst && game && <MoveBurst activity={moveBurst} fromMe={moveBurst.actor === perspective} />}</AnimatePresence>

      {screen !== "game" && (
        <DealLobby
          screen={screen}
          name={name}
          sisterName={sisterName}
          codeInput={codeInput}
          activeCode={activeCode}
          players={lobbyPlayers}
          status={status}
          peerReady={peerReady}
          setName={setName}
          setSisterName={setSisterName}
          setCodeInput={setCodeInput}
          setScreen={setScreen}
          createRoom={createRoom}
          joinRoom={joinRoom}
          startOnline={startOnlineGame}
          startPractice={startPractice}
          copyCode={copyCode}
          exit={exitGame}
        />
      )}

      {screen === "game" && game && (
        <DealTable
          game={game}
          perspective={perspective}
          role={role}
          roomCode={activeCode}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCard}
          onCloseCard={() => setSelectedCard(null)}
          onAction={perform}
          onExit={exitGame}
        />
      )}
    </main>
  );
}

type LobbyProps = {
  screen: Screen;
  name: string;
  sisterName: string;
  codeInput: string;
  activeCode: string;
  players: string[];
  status: string;
  peerReady: boolean;
  setName(value: string): void;
  setSisterName(value: string): void;
  setCodeInput(value: string): void;
  setScreen(value: Screen): void;
  createRoom(): void;
  joinRoom(): void;
  startOnline(): void;
  startPractice(): void;
  copyCode(): void;
  exit(): void;
};

function DealLobby(props: LobbyProps) {
  const isWaiting = isDealLobbyWaiting(props.screen);
  return (
    <div className="dh-lobby-shell">
      <div className="dh-lobby-grid" aria-hidden />
      <header className="dh-lobby-nav">
        <Link href="/"><ArrowLeft weight="bold" /> Game shelf</Link>
        <span><Buildings weight="duotone" /> DEALHOUSE</span>
      </header>

      <section className="dh-lobby-card">
        {!isWaiting && (
          <>
            <div className="dh-brand-art" aria-hidden><span /><span /><span /><Buildings weight="duotone" /></div>
            <div className="dh-eyebrow"><Lightning weight="fill" /> Live property card game</div>
            <h1>Build the city.<br /><span>Break the deal.</span></h1>
            <p className="dh-lede">Complete three districts before your rival. Bank cards, charge rent, and watch every move cross the table in real time.</p>
            <label className="dh-field"><span>Your name</span><input value={props.name} maxLength={18} onChange={(event) => props.setName(event.target.value)} placeholder="Nadya" /></label>

            {props.screen === "menu" && (
              <div className="dh-lobby-actions">
                <button className="dh-button dh-button--primary" onClick={props.createRoom} disabled={!props.peerReady}><LockKey weight="bold" /> Create private room <ArrowRight weight="bold" /></button>
                <button className="dh-button dh-button--secondary" onClick={() => props.setScreen("join")}><UsersThree weight="bold" /> Join with a code</button>
                <div className="dh-divider"><span>or test on one screen</span></div>
                <label className="dh-field"><span>Second player</span><input value={props.sisterName} maxLength={18} onChange={(event) => props.setSisterName(event.target.value)} placeholder="Sister" /></label>
                <button className="dh-text-button" onClick={props.startPractice}><Play weight="fill" /> Start pass-and-play</button>
              </div>
            )}

            {props.screen === "join" && (
              <div className="dh-lobby-actions">
                <label className="dh-field"><span>Room code</span><input className="dh-code-input" value={props.codeInput} maxLength={5} onChange={(event) => props.setCodeInput(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && props.joinRoom()} placeholder="A7K2Q" autoFocus /></label>
                <button className="dh-button dh-button--primary" onClick={props.joinRoom}><ArrowRight weight="bold" /> Join table</button>
                <button className="dh-text-button" onClick={() => props.setScreen("menu")}><ArrowLeft /> Back</button>
                {props.status && <p className="dh-status">{props.status}</p>}
              </div>
            )}
          </>
        )}

        {isWaiting && (
          <div className="dh-waiting">
            <div className="dh-wait-icon"><span /><UsersThree weight="duotone" /></div>
            <div className="dh-eyebrow"><i /> Private table open</div>
            <h1>{props.screen === "host" ? "Invite your rival." : "You’re at the table."}</h1>
            {props.activeCode && <button className="dh-room-code" onClick={props.copyCode} aria-label="Copy room code"><span>{props.activeCode}</span><Copy weight="bold" /></button>}
            <p className="dh-status">{props.status}</p>
            <div className="dh-player-list">
              {[0, 1].map((index) => <div key={index} className={props.players[index] ? "joined" : ""}><span className="dh-avatar">{props.players[index]?.[0] || "?"}</span><strong>{props.players[index] || "Waiting for player…"}</strong>{props.players[index] && <Check weight="bold" />}</div>)}
            </div>
            {props.screen === "host" && <button className="dh-button dh-button--primary" onClick={props.startOnline} disabled={props.players.length < 2}>Start game <ArrowRight weight="bold" /></button>}
            <button className="dh-text-button" onClick={props.exit}>Close table</button>
          </div>
        )}
      </section>
      <p className="dh-fineprint">Original fan-made game · No account needed · Host keeps the tab open</p>
    </div>
  );
}

type TableProps = {
  game: DealState;
  perspective: number;
  role: Role;
  roomCode: string;
  selectedCard: DealCard | null;
  onSelectCard(card: DealCard): void;
  onCloseCard(): void;
  onAction(action: DealAction): void;
  onExit(): void;
};

function DealTable(props: TableProps) {
  const { game, perspective } = props;
  const me = game.players[perspective];
  const opponentIndex = perspective === 0 ? 1 : 0;
  const opponent = game.players[opponentIndex];
  const isMyTurn = game.currentPlayer === perspective;
  const canUseHand = isMyTurn && game.phase === "playing";
  const latest = game.activities[0];

  return (
    <div className="dh-table-shell">
      <header className="dh-table-nav">
        <button onClick={props.onExit} className="dh-icon-button" aria-label="Leave game"><ArrowLeft weight="bold" /></button>
        <div className="dh-table-title"><Buildings weight="duotone" /><strong>Dealhouse</strong>{props.roomCode && <span>Room {props.roomCode}</span>}{props.role === "local" && <span>Pass & play</span>}</div>
        <div className="dh-connection"><i /> {props.role === "local" ? "One device" : "Live"}</div>
      </header>

      <div className="dh-game-grid">
        <section className="dh-board-zone dh-board-zone--opponent">
          <PlayerHeader player={opponent} active={game.currentPlayer === opponentIndex} isMe={false} />
          <PlayerAssets player={opponent} concealed />
        </section>

        <section className="dh-center-zone">
          <div className="dh-decks">
            <div className="dh-draw-pile"><Stack weight="duotone" /><strong>{game.deck.length}</strong><span>Draw pile</span></div>
            <div className="dh-discard-pile"><CardsThree weight="duotone" /><strong>{game.discard.length}</strong><span>Discard</span></div>
          </div>
          <div className="dh-live-panel">
            <div className="dh-live-label"><i /> Live move</div>
            <AnimatePresence mode="wait">
              <motion.div key={latest?.id || "ready"} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }}>
                <strong>{latest?.title || "The table is ready"}</strong>
                <span>{latest?.detail || "Confirmed moves appear here."}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="dh-turn-controls">
            <span><b>{game.actionsLeft}</b> move{game.actionsLeft === 1 ? "" : "s"} left</span>
            <button onClick={() => props.onAction({ type: "endTurn" })} disabled={!isMyTurn || game.phase !== "playing"}>End turn <SignOut weight="bold" /></button>
          </div>
        </section>

        <section className="dh-board-zone dh-board-zone--me">
          <PlayerHeader player={me} active={isMyTurn} isMe />
          <PlayerAssets player={me} />
          <div className="dh-hand-wrap">
            <div className="dh-section-label"><span>Your hand</span><b>{me.hand.length} cards</b></div>
            <div className="dh-hand" aria-label={`${me.name}'s hand`}>
              {me.hand.map((card, index) => (
                <GameCard
                  key={card.id}
                  card={card}
                  index={index}
                  compact={false}
                  disabled={!canUseHand && !(game.phase === "discarding" && isMyTurn)}
                  selected={game.pendingPayment?.selectedAssetIds.includes(card.id)}
                  onClick={() => {
                    if (game.phase === "discarding" && isMyTurn) props.onAction({ type: "discardCard", cardId: card.id });
                    else if (canUseHand) props.onSelectCard(card);
                  }}
                />
              ))}
              {me.hand.length === 0 && <div className="dh-empty-hand">Your hand is empty.</div>}
            </div>
          </div>
        </section>
      </div>

      {game.phase === "paying" && game.pendingPayment && (
        <PaymentSheet game={game} perspective={perspective} onAction={props.onAction} />
      )}

      {game.phase === "over" && <WinnerSheet game={game} perspective={perspective} onExit={props.onExit} />}

      <AnimatePresence>
        {props.selectedCard && (
          <CardActionSheet game={game} playerIndex={perspective} card={props.selectedCard} onAction={props.onAction} onClose={props.onCloseCard} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerHeader({ player, active, isMe }: { player: DealPlayer; active: boolean; isMe: boolean }) {
  return (
    <div className={`dh-player-header ${active ? "active" : ""}`}>
      <span className="dh-avatar">{player.name[0]?.toUpperCase()}</span>
      <div><strong>{player.name}{isMe ? " · You" : ""}</strong><span>{active ? "Choosing a move" : "Watching the table"}</span></div>
      <div className="dh-score"><b>{completedGroups(player)}</b><span>/ 3 districts</span></div>
      <div className="dh-bank-total"><Bank weight="duotone" /><b>{bankTotal(player)}M</b></div>
      {!isMe && <div className="dh-hand-count"><CardsThree /><b>{player.hand.length}</b></div>}
    </div>
  );
}

function PlayerAssets({ player, concealed = false }: { player: DealPlayer; concealed?: boolean }) {
  return (
    <div className="dh-assets">
      <div className="dh-property-board">
        {GROUP_ORDER.map((group) => {
          const cards = player.properties[group];
          if (cards.length === 0) return null;
          return <PropertyStack key={group} group={group} cards={cards} complete={groupIsComplete(player, group)} concealed={concealed} />;
        })}
        {GROUP_ORDER.every((group) => player.properties[group].length === 0) && <div className="dh-empty-zone">No districts built yet</div>}
      </div>
      <div className="dh-bank-stack" aria-label={`${bankTotal(player)} million in bank`}>
        {player.bank.slice(-5).map((card, index) => <span key={card.id} style={{ transform: `translate(${index * 3}px, ${index * -2}px)` }}>{card.value}M</span>)}
        {player.bank.length === 0 && <span className="empty"><Bank /></span>}
      </div>
    </div>
  );
}

function PropertyStack({ group, cards, complete, concealed }: { group: GroupId; cards: DealPlayer["properties"][GroupId]; complete: boolean; concealed: boolean }) {
  const rent = GROUPS[group].rents[Math.min(cards.length, GROUPS[group].size) - 1] ?? 0;
  return (
    <div className={`dh-property-stack group-${group} ${complete ? "complete" : ""}`} title={`${GROUPS[group].name}: ${cards.length}/${GROUPS[group].size}`}>
      {cards.map((card, index) => <span key={card.id} style={{ transform: `translateY(${index * 6}px)` }} />)}
      <div><b>{GROUPS[group].name}</b><small>{cards.length}/{GROUPS[group].size}{concealed ? "" : ` · rent ${rent}M`}</small></div>
      {complete && <Check weight="bold" />}
    </div>
  );
}

type GameCardProps = {
  card: DealCard;
  index?: number;
  compact?: boolean;
  disabled?: boolean;
  selected?: boolean;
  onClick?(): void;
};

function GameCard({ card, index = 0, compact = false, disabled = false, selected = false, onClick }: GameCardProps) {
  const icon = card.kind === "property" ? <Buildings weight="duotone" /> : card.kind === "money" ? <HandCoins weight="duotone" /> : <Sparkle weight="duotone" />;
  const groupClass = card.kind === "property" ? `group-${card.group}` : "";
  return (
    <button
      type="button"
      className={`dh-card dh-card--${card.kind} ${groupClass} ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}
      style={{ "--card-index": index } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${card.name}, value ${card.value} million`}
    >
      <span className="dh-card-value">{card.value}M</span>
      <span className="dh-card-icon">{icon}</span>
      <span className="dh-card-name">{card.kind === "property" ? GROUPS[card.group].name : card.name}</span>
      <span className="dh-card-body">{card.kind === "property" ? `${GROUPS[card.group].size} to complete` : card.kind === "money" ? "Bank this note" : card.body}</span>
    </button>
  );
}

function CardActionSheet({ game, playerIndex, card, onAction, onClose }: { game: DealState; playerIndex: number; card: DealCard; onAction(action: DealAction): void; onClose(): void }) {
  const player = game.players[playerIndex];
  const opponent = game.players[playerIndex === 0 ? 1 : 0];
  const [swapOwnId, setSwapOwnId] = useState("");
  const [swapTargetId, setSwapTargetId] = useState("");
  const actionCard = card.kind === "action" ? card as ActionCard : null;
  const ownedGroups = GROUP_ORDER.filter((group) => player.properties[group].length > 0);
  const stealable = GROUP_ORDER.flatMap((group) => groupIsComplete(opponent, group) ? [] : opponent.properties[group]);
  const tradeableOwn = GROUP_ORDER.flatMap((group) => groupIsComplete(player, group) ? [] : player.properties[group]);

  const playAction = (extra: Partial<Extract<DealAction, { type: "playAction" }>> = {}) => {
    onAction({ type: "playAction", cardId: card.id, ...extra });
  };

  return (
    <motion.div className="dh-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="dh-card-sheet" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }}>
        <button className="dh-sheet-close" onClick={onClose} aria-label="Close"><X /></button>
        <GameCard card={card} compact />
        <div className="dh-sheet-copy"><span>{card.kind}</span><h2>{card.name}</h2><p>{card.kind === "action" ? card.body : card.kind === "property" ? `Add this to ${GROUPS[card.group].name}. Complete ${GROUPS[card.group].size} properties to finish the district.` : "Place this note in your bank. Banked cards can pay rent and fees."}</p></div>

        {card.kind === "money" && <button className="dh-button dh-button--primary" onClick={() => onAction({ type: "bankCard", cardId: card.id })}><Bank weight="bold" /> Bank {card.value}M</button>}
        {card.kind === "property" && <button className="dh-button dh-button--primary" onClick={() => onAction({ type: "playProperty", cardId: card.id })}><Buildings weight="bold" /> Build in {GROUPS[card.group].name}</button>}

        {actionCard?.action === "draw2" && <button className="dh-button dh-button--primary" onClick={() => playAction()}><CardsThree weight="bold" /> Play and draw two</button>}
        {actionCard?.action === "collect" && <button className="dh-button dh-button--primary" onClick={() => playAction()}><HandCoins weight="bold" /> Collect 2M</button>}

        {actionCard?.action === "rent" && (
          <div className="dh-choice-list"><span>Choose a district</span>{ownedGroups.length ? ownedGroups.map((group) => <button key={group} onClick={() => playAction({ group })}><i className={`group-dot group-${group}`} /><b>{GROUPS[group].name}</b><small>{rentFor(player, group)}M rent</small><ArrowRight /></button>) : <p>Build a property before playing rent.</p>}</div>
        )}

        {actionCard?.action === "steal" && (
          <div className="dh-choice-list"><span>Choose a rival property</span>{stealable.length ? stealable.map((property) => <button key={property.id} onClick={() => playAction({ targetCardId: property.id })}><i className={`group-dot group-${property.group}`} /><b>{GROUPS[property.group].name}</b><small>{property.value}M value</small><ArrowRight /></button>) : <p>No unprotected properties are available.</p>}</div>
        )}

        {actionCard?.action === "swap" && (
          <div className="dh-swap-picker">
            <div className="dh-choice-list"><span>Give one of yours</span>{tradeableOwn.map((property) => <button className={swapOwnId === property.id ? "selected" : ""} key={property.id} onClick={() => setSwapOwnId(property.id)}><i className={`group-dot group-${property.group}`} /><b>{GROUPS[property.group].name}</b>{swapOwnId === property.id && <Check />}</button>)}</div>
            <div className="dh-choice-list"><span>Take one of theirs</span>{stealable.map((property) => <button className={swapTargetId === property.id ? "selected" : ""} key={property.id} onClick={() => setSwapTargetId(property.id)}><i className={`group-dot group-${property.group}`} /><b>{GROUPS[property.group].name}</b>{swapTargetId === property.id && <Check />}</button>)}</div>
            <button className="dh-button dh-button--primary" disabled={!swapOwnId || !swapTargetId} onClick={() => playAction({ ownCardId: swapOwnId, targetCardId: swapTargetId })}>Confirm swap <ArrowRight weight="bold" /></button>
          </div>
        )}

        {card.kind === "action" && <button className="dh-button dh-button--secondary" onClick={() => onAction({ type: "bankCard", cardId: card.id })}><Bank /> Bank for {card.value}M instead</button>}
      </motion.section>
    </motion.div>
  );
}

function PaymentSheet({ game, perspective, onAction }: { game: DealState; perspective: number; onAction(action: DealAction): void }) {
  const payment = game.pendingPayment!;
  const isPayer = perspective === payment.from;
  const payer = game.players[payment.from];
  const assets = paymentAssets(payer);
  const selected = assets.filter(({ card }) => payment.selectedAssetIds.includes(card.id));
  const selectedValue = selected.reduce((sum, { card }) => sum + card.value, 0);
  const totalAvailable = assets.reduce((sum, { card }) => sum + card.value, 0);
  const required = Math.min(payment.amount, totalAvailable);

  return (
    <div className="dh-sheet-backdrop dh-payment-backdrop">
      <motion.section className="dh-payment-sheet" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <div className="dh-payment-icon"><HandCoins weight="duotone" /></div>
        <div className="dh-eyebrow">{payment.reason}</div>
        <h2>{isPayer ? `Choose ${required}M to pay` : `${payer.name} is choosing payment`}</h2>
        <p>{isPayer ? "Select bank notes or properties. Overpayment does not return change." : "Their selections are updating live. The cards will slide across when confirmed."}</p>
        {isPayer && (
          <>
            <div className="dh-payment-assets">
              {assets.map(({ card, zone }) => {
                const isSelected = payment.selectedAssetIds.includes(card.id);
                return <button key={card.id} className={`${isSelected ? "selected" : ""} ${card.kind === "property" ? `group-${card.group}` : ""}`} onClick={() => onAction({ type: "togglePayment", cardId: card.id })}><span>{card.value}M</span><b>{card.kind === "property" ? GROUPS[card.group].name : card.name}</b><small>{zone}</small>{isSelected && <Check weight="bold" />}</button>;
              })}
            </div>
            <button className="dh-button dh-button--primary" disabled={selectedValue < required} onClick={() => onAction({ type: "confirmPayment" })}>Pay {selectedValue}M <ArrowRight weight="bold" /></button>
          </>
        )}
        {!isPayer && <div className="dh-thinking"><span /><span /><span /></div>}
      </motion.section>
    </div>
  );
}

function WinnerSheet({ game, perspective, onExit }: { game: DealState; perspective: number; onExit(): void }) {
  const winner = game.players[game.winner ?? 0];
  return (
    <div className="dh-sheet-backdrop dh-winner-backdrop">
      <motion.section className="dh-winner-sheet" initial={{ opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 250, damping: 22 }}>
        <div className="dh-win-mark"><Buildings weight="duotone" /><Sparkle weight="fill" /></div>
        <div className="dh-eyebrow">City complete</div>
        <h2>{winner.id === perspective ? "You win." : `${winner.name} wins.`}</h2>
        <p>Three complete districts and a properly dramatic finish.</p>
        <div className="dh-final-score">{game.players.map((player) => <div key={player.id}><span>{player.name}</span><strong>{completedGroups(player)}/3</strong><small>{bankTotal(player)}M banked</small></div>)}</div>
        <button className="dh-button dh-button--primary" onClick={onExit}>Back to game shelf <ArrowRight weight="bold" /></button>
      </motion.section>
    </div>
  );
}

function TurnFlash({ name }: { name: string }) {
  return (
    <motion.div className="dh-turn-flash" initial={{ opacity: 0, scale: .9, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.06, filter: "blur(5px)" }} transition={{ duration: .22 }}>
      <span><Lightning weight="fill" /></span><div><small>TABLE READY</small><strong>{name}, your turn.</strong></div>
    </motion.div>
  );
}

function MoveBurst({ activity, fromMe }: { activity: DealActivity; fromMe: boolean }) {
  return (
    <motion.div className={`dh-move-burst ${fromMe ? "from-me" : "from-them"}`} initial={{ opacity: 0, y: fromMe ? 160 : -160, rotate: fromMe ? -8 : 8, scale: .7 }} animate={{ opacity: [0, 1, 1, 0], y: [fromMe ? 160 : -160, 0, 0, fromMe ? -130 : 130], rotate: [fromMe ? -8 : 8, 0, 0, fromMe ? 5 : -5], scale: [.7, 1, 1, .82] }} transition={{ duration: 1.35, times: [0, .2, .72, 1], ease: [0.22, 1, 0.36, 1] }}>
      {activity.visual === "money" ? <HandCoins weight="duotone" /> : activity.visual === "property" ? <Buildings weight="duotone" /> : <CardsThree weight="duotone" />}
      <span>{activity.title}</span>
    </motion.div>
  );
}
