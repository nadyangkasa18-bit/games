export const SUSHI_ROUNDS = 3;
export const SUSHI_HAND_SIZE = 10;

export type SushiKind =
  | "maki1"
  | "maki2"
  | "maki3"
  | "tempura"
  | "sashimi"
  | "dumpling"
  | "egg"
  | "salmon"
  | "squid"
  | "wasabi"
  | "pudding";

export type SushiCard = {
  id: string;
  kind: SushiKind;
};

export type SushiReveal = {
  id: string;
  cards: [SushiCard, SushiCard];
  text: string;
};

export type SushiGame = {
  players: [string, string];
  cycle: number;
  round: number;
  turn: number;
  phase: "drafting" | "round-score" | "finished";
  hands: [SushiCard[], SushiCard[]];
  selected: [string | null, string | null];
  tableaus: [SushiCard[], SushiCard[]];
  puddings: [number, number];
  scores: [number, number];
  lastRoundScores: [number, number];
  drawPile: SushiCard[];
  lastReveal: SushiReveal | null;
};

export type SushiAction =
  | { type: "select"; cardId: string }
  | { type: "nextRound" };

const CARD_COUNTS: Array<[SushiKind, number]> = [
  ["maki1", 6], ["maki2", 12], ["maki3", 8],
  ["tempura", 14], ["sashimi", 14], ["dumpling", 14],
  ["egg", 5], ["salmon", 10], ["squid", 5],
  ["wasabi", 6], ["pudding", 10],
];

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function buildSushiDeck(cycle: number) {
  const deck = CARD_COUNTS.flatMap(([kind, count]) =>
    Array.from({ length: count }, (_, index) => ({ id: `${kind}-${index + 1}`, kind })),
  );
  const random = seededRandom((cycle + 1) * 65537);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function dealHands(drawPile: SushiCard[]) {
  return {
    hands: [
      drawPile.slice(0, SUSHI_HAND_SIZE),
      drawPile.slice(SUSHI_HAND_SIZE, SUSHI_HAND_SIZE * 2),
    ] as [SushiCard[], SushiCard[]],
    drawPile: drawPile.slice(SUSHI_HAND_SIZE * 2),
  };
}

export function createSushiGame(firstPlayer: string, secondPlayer: string, cycle: number): SushiGame {
  const dealt = dealHands(buildSushiDeck(cycle));
  return {
    players: [firstPlayer, secondPlayer],
    cycle,
    round: 1,
    turn: 1,
    phase: "drafting",
    hands: dealt.hands,
    selected: [null, null],
    tableaus: [[], []],
    puddings: [0, 0],
    scores: [0, 0],
    lastRoundScores: [0, 0],
    drawPile: dealt.drawPile,
    lastReveal: null,
  };
}

export function makiIcons(kind: SushiKind) {
  if (kind === "maki1") return 1;
  if (kind === "maki2") return 2;
  if (kind === "maki3") return 3;
  return 0;
}

export function nigiriValue(kind: SushiKind) {
  if (kind === "egg") return 1;
  if (kind === "salmon") return 2;
  if (kind === "squid") return 3;
  return 0;
}

export function scoreSushiTableau(cards: SushiCard[]) {
  const count = (kind: SushiKind) => cards.filter((card) => card.kind === kind).length;
  let score = Math.floor(count("tempura") / 2) * 5;
  score += Math.floor(count("sashimi") / 3) * 10;
  score += [0, 1, 3, 6, 10, 15][Math.min(5, count("dumpling"))];

  let unusedWasabi = 0;
  for (const card of cards) {
    if (card.kind === "wasabi") {
      unusedWasabi += 1;
      continue;
    }
    const nigiri = nigiriValue(card.kind);
    if (!nigiri) continue;
    if (unusedWasabi > 0) {
      score += nigiri * 3;
      unusedWasabi -= 1;
    } else {
      score += nigiri;
    }
  }
  return score;
}

function scoreRound(game: SushiGame, tableaus: [SushiCard[], SushiCard[]]) {
  const roundScores: [number, number] = [
    scoreSushiTableau(tableaus[0]),
    scoreSushiTableau(tableaus[1]),
  ];
  const maki: [number, number] = [
    tableaus[0].reduce((total, card) => total + makiIcons(card.kind), 0),
    tableaus[1].reduce((total, card) => total + makiIcons(card.kind), 0),
  ];
  if (maki[0] === maki[1] && maki[0] > 0) {
    roundScores[0] += 3;
    roundScores[1] += 3;
  } else if (maki[0] > maki[1]) {
    roundScores[0] += 6;
    if (maki[1] > 0) roundScores[1] += 3;
  } else if (maki[1] > maki[0]) {
    roundScores[1] += 6;
    if (maki[0] > 0) roundScores[0] += 3;
  }

  const puddings: [number, number] = [
    game.puddings[0] + tableaus[0].filter((card) => card.kind === "pudding").length,
    game.puddings[1] + tableaus[1].filter((card) => card.kind === "pudding").length,
  ];
  if (game.round === SUSHI_ROUNDS && puddings[0] !== puddings[1]) {
    const winner = puddings[0] > puddings[1] ? 0 : 1;
    roundScores[winner] += 6;
    roundScores[winner === 0 ? 1 : 0] -= 6;
  }

  return {
    ...game,
    phase: game.round === SUSHI_ROUNDS ? "finished" as const : "round-score" as const,
    tableaus,
    puddings,
    scores: [game.scores[0] + roundScores[0], game.scores[1] + roundScores[1]] as [number, number],
    lastRoundScores: roundScores,
    selected: [null, null] as [null, null],
  };
}

export function applySushiAction(game: SushiGame, actor: number, action: SushiAction): SushiGame {
  if (action.type === "nextRound" && game.phase === "round-score") {
    const dealt = dealHands(game.drawPile);
    return {
      ...game,
      round: game.round + 1,
      turn: 1,
      phase: "drafting",
      hands: dealt.hands,
      drawPile: dealt.drawPile,
      selected: [null, null],
      tableaus: [[], []],
      lastReveal: null,
    };
  }

  if (action.type !== "select" || game.phase !== "drafting" || (actor !== 0 && actor !== 1)) return game;
  if (game.selected[actor] || !game.hands[actor].some((card) => card.id === action.cardId)) return game;

  const selected = [...game.selected] as [string | null, string | null];
  selected[actor] = action.cardId;
  if (!selected[0] || !selected[1]) return { ...game, selected };

  const first = game.hands[0].find((card) => card.id === selected[0]);
  const second = game.hands[1].find((card) => card.id === selected[1]);
  if (!first || !second) return game;

  const remaining: [SushiCard[], SushiCard[]] = [
    game.hands[0].filter((card) => card.id !== selected[0]),
    game.hands[1].filter((card) => card.id !== selected[1]),
  ];
  const tableaus: [SushiCard[], SushiCard[]] = [
    [...game.tableaus[0], first],
    [...game.tableaus[1], second],
  ];
  const resolved: SushiGame = {
    ...game,
    turn: game.turn + 1,
    hands: [remaining[1], remaining[0]],
    selected: [null, null],
    tableaus,
    lastReveal: {
      id: `${game.round}-${game.turn}-${first.id}-${second.id}`,
      cards: [first, second],
      text: `${game.players[0]} played ${cardLabel(first.kind)} · ${game.players[1]} played ${cardLabel(second.kind)}`,
    },
  };
  return remaining[0].length === 0 ? scoreRound(resolved, tableaus) : resolved;
}

export function sushiViewFor(game: SushiGame, perspective: 0 | 1): SushiGame {
  const other = perspective === 0 ? 1 : 0;
  const hands: [SushiCard[], SushiCard[]] = [game.hands[0], game.hands[1]];
  hands[other] = [];
  const selected: [string | null, string | null] = [game.selected[0], game.selected[1]];
  if (selected[other]) selected[other] = "locked";
  return { ...game, hands, selected };
}

export function cardLabel(kind: SushiKind) {
  const labels: Record<SushiKind, string> = {
    maki1: "Maki 1", maki2: "Maki 2", maki3: "Maki 3",
    tempura: "Tempura", sashimi: "Sashimi", dumpling: "Dumpling",
    egg: "Egg nigiri", salmon: "Salmon nigiri", squid: "Squid nigiri",
    wasabi: "Wasabi", pudding: "Pudding",
  };
  return labels[kind];
}

export function cardRule(kind: SushiKind) {
  if (kind.startsWith("maki")) return `${makiIcons(kind)} maki icon${makiIcons(kind) > 1 ? "s" : ""}`;
  if (kind === "tempura") return "Pair = 5";
  if (kind === "sashimi") return "Set of 3 = 10";
  if (kind === "dumpling") return "More = more points";
  if (kind === "wasabi") return "Next nigiri ×3";
  if (kind === "pudding") return "Scores after round 3";
  return `${nigiriValue(kind)} point nigiri`;
}
