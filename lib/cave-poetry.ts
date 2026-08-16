export const POETRY_ROUND_SECONDS = 90;
export const POETRY_TOTAL_ROUNDS = 6;

export type PoetrySpice = "clean" | "spicy";
export type PoetryRoundSeconds = 60 | 90 | 120;

export type PoetrySettings = {
  teamNames: [string, string];
  spice: PoetrySpice;
  roundSeconds: PoetryRoundSeconds;
};

export type PoetrySide = "front" | "back";
export type PoetryPhase = "ready" | "playing" | "round-end" | "finished";

export type PoetryPrompt = {
  one: string;
  three: string;
};

export type PoetryCard = {
  id: string;
  front: PoetryPrompt;
  back: PoetryPrompt;
};

export type PoetryMove = {
  id: string;
  kind: "score" | "bonk" | "flip";
  points: number;
  text: string;
};

export type PoetryGame = {
  players: [string, string];
  settings: PoetrySettings;
  teamScores: [number, number];
  cycle: number;
  deck: PoetryCard[];
  cardIndex: number;
  side: PoetrySide;
  poet: 0 | 1;
  round: number;
  phase: PoetryPhase;
  score: number;
  roundScore: number;
  roundScores: number[];
  deadline: number | null;
  lastMove: PoetryMove | null;
};

export type PoetryAction =
  | { type: "startRound"; now: number }
  | { type: "flipCard" }
  | { type: "scoreCard"; points: 1 | 3 }
  | { type: "bonk" }
  | { type: "endRound" }
  | { type: "nextRound" };

type RawCard = [string, string, string, string];

// Original prompts written for Table for Two. A large bank and a persisted
// cycle seed keep consecutive games from opening with the same cards.
const RAW_CARDS: RawCard[] = [
  ["Rain", "Rain coat", "Moon", "Moon light"],
  ["Coffee", "Coffee shop", "Beach", "Beach ball"],
  ["Apple", "Apple pie", "Plane", "Plane seat"],
  ["Birthday", "Birthday cake", "Tooth", "Tooth brush"],
  ["Snow", "Snow globe", "Book", "Book shelf"],
  ["Phone", "Phone call", "Sun", "Sun burn"],
  ["Door", "Door bell", "Camp", "Camp fire"],
  ["Popcorn", "Popcorn bowl", "Star", "Star fish"],
  ["School", "School bus", "Dog", "Dog park"],
  ["Night", "Night light", "Tea", "Tea cup"],
  ["House", "House plant", "Fish", "Fish tank"],
  ["Cheese", "Cheese cake", "Brain", "Brain freeze"],
  ["Key", "Key chain", "Road", "Road trip"],
  ["Dance", "Dance floor", "Milk", "Milk shake"],
  ["Space", "Space ship", "Foot", "Foot ball"],
  ["Bed", "Bed room", "Cake", "Cake stand"],
  ["Fire", "Fire fly", "Hand", "Hand bag"],
  ["Water", "Water fall", "Mail", "Mail box"],
  ["Ice", "Ice cream", "Bird", "Bird bath"],
  ["Car", "Car wash", "Tree", "Tree house"],
  ["Clock", "Clock face", "Hair", "Hair cut"],
  ["Gold", "Gold fish", "News", "News stand"],
  ["Pan", "Pan cake", "Lip", "Lip gloss"],
  ["Ship", "Ship wreck", "Wall", "Wall clock"],
  ["Sweet", "Sweet corn", "Back", "Back pack"],
  ["Dream", "Dream job", "Color", "Color wheel"],
  ["Crater", "Moon crater", "Cat", "Cat nap"],
  ["Stone", "Stone age", "Pool", "Pool side"],
  ["Hot", "Hot dog", "Cow", "Cow bell"],
  ["Face", "Face mask", "Play", "Play ground"],
  ["Rock", "Rock star", "Shoe", "Shoe lace"],
  ["Earth", "Earth quake", "Dawn", "Dawn sky"],
  ["Cup", "Cup cake", "Frost", "Frost bite"],
  ["Farm", "Farm house", "Sand", "Sand box"],
  ["Horse", "Horse shoe", "Time", "Time line"],
  ["Light", "Light house", "Head", "Head phones"],
  ["Butter", "Butter fly", "Home", "Home work"],
  ["Work", "Work out", "Sea", "Sea shell"],
  ["Lunch", "Lunch box", "Thumb", "Thumb print"],
  ["Glass", "Glass house", "Jelly", "Jelly fish"],
  ["Fast", "Fast food", "Note", "Note book"],
  ["Eye", "Eye ball", "Cloud", "Cloud burst"],
  ["Park", "Park bench", "White", "White board"],
  ["Black", "Black bird", "Side", "Side walk"],
  ["Blue", "Blue whale", "Green", "Green house"],
  ["Toy", "Toy box", "Soap", "Soap dish"],
  ["Game", "Game night", "Desk", "Desk lamp"],
  ["Jam", "Jam jar", "Drum", "Drum stick"],
  ["Shop", "Shop cart", "Food", "Food truck"],
  ["Train", "Train track", "Mouse", "Mouse trap"],
  ["Salt", "Salt shake", "Pea", "Pea soup"],
  ["King", "King size", "Grass", "Grass land"],
  ["Ring", "Ring tone", "Watch", "Watch band"],
  ["Flag", "Flag pole", "Suit", "Suit case"],
  ["Pig", "Pig bank", "Map", "Map pin"],
  ["Chest", "Chest pain", "Life", "Life guard"],
  ["Safe", "Safe house", "Cross", "Cross walk"],
  ["Cold", "Cold snap", "Warm", "Warm up"],
  ["Trip", "Trip plan", "Wave", "Wave pool"],
  ["Stick", "Stick bug", "Shell", "Shell fish"],
  ["Bat", "Bat cave", "Bear", "Bear hug"],
  ["Bell", "Bell hop", "Duck", "Duck face"],
  ["Ghost", "Ghost town", "Storm", "Storm cloud"],
  ["Speed", "Speed bump", "Wish", "Wish list"],
  ["Love", "Love song", "Song", "Song bird"],
  ["Gift", "Gift wrap", "Box", "Box score"],
  ["Spring", "Spring break", "Fall", "Fall out"],
  ["Deep", "Deep sea", "High", "High five"],
  ["Low", "Low tide", "Big", "Big bang"],
  ["First", "First aid", "Last", "Last call"],
  ["Quick", "Quick sand", "Slow", "Slow dance"],
  ["Soft", "Soft ball", "Hard", "Hard hat"],
];

// Optional 18+ prompts. The spicy setting mixes these into the clean bank,
// keeping the deck varied while making the tone unmistakably more grown-up.
const RAW_SPICY_CARDS: RawCard[] = [
  ["Crush", "Work crush", "Date", "Bad date"],
  ["Ex", "Drunk text", "Kiss", "First kiss"],
  ["Flirt", "Flirt text", "Nudes", "Send nudes"],
  ["Thong", "Lace thong", "Bra", "Push up bra"],
  ["Kink", "Secret kink", "Lube", "Body lube"],
  ["Condom", "Safe sex", "Hookup", "Late hookup"],
  ["Hickey", "Love bite", "Booty", "Booty call"],
  ["Nipple", "Nipple ring", "Strip", "Strip club"],
  ["Horny", "Horny text", "Naughty", "Naughty list"],
  ["Tinder", "Tinder date", "Thirst", "Thirst trap"],
  ["Shots", "Tequila shots", "Weed", "Weed brownie"],
  ["Hangover", "Bad hangover", "Tipsy", "Tipsy kiss"],
  ["Bedroom", "Bedroom eyes", "Handcuffs", "Pink handcuffs"],
  ["Vibrator", "Pocket vibrator", "Orgasm", "Fake orgasm"],
  ["Topless", "Topless beach", "Sexting", "Late night sexting"],
  ["DILF", "Hot DILF", "MILF", "Hot MILF"],
  ["Walk", "Walk of shame", "Morning", "Morning after"],
  ["Moan", "Loud moan", "Spank", "Playful spank"],
  ["Naked", "Naked truth", "Quickie", "Lunch break quickie"],
  ["Sugar", "Sugar daddy", "Daddy", "Call me daddy"],
  ["Swipe", "Swipe right", "Ghosted", "Got ghosted"],
  ["Fantasy", "Secret fantasy", "Roleplay", "Bedroom roleplay"],
  ["Booze", "Cheap booze", "Cocktail", "Strong cocktail"],
  ["Bachelorette", "Wild bachelorette", "Bachelor", "Bachelor party"],
];

export const POETRY_CARDS: PoetryCard[] = RAW_CARDS.map(
  ([frontOne, frontThree, backOne, backThree], index) => ({
    id: `cave-${index + 1}`,
    front: { one: frontOne, three: frontThree },
    back: { one: backOne, three: backThree },
  }),
);

export const POETRY_SPICY_CARDS: PoetryCard[] = RAW_SPICY_CARDS.map(
  ([frontOne, frontThree, backOne, backThree], index) => ({
    id: `spicy-${index + 1}`,
    front: { one: frontOne, three: frontThree },
    back: { one: backOne, three: backThree },
  }),
);

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function buildPoetryDeck(cycle: number, spice: PoetrySpice = "clean") {
  const deck = spice === "spicy"
    ? [...POETRY_CARDS, ...POETRY_SPICY_CARDS]
    : [...POETRY_CARDS];
  const random = seededRandom((cycle + 1) * 7919 + (spice === "spicy" ? 104729 : 0));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  const offset = (cycle * 17) % deck.length;
  return [...deck.slice(offset), ...deck.slice(0, offset)];
}

export function createPoetryGame(
  firstPlayer: string,
  secondPlayer: string,
  cycle: number,
  settings: PoetrySettings = {
    teamNames: ["Team Stone", "Team Flame"],
    spice: "clean",
    roundSeconds: POETRY_ROUND_SECONDS,
  },
): PoetryGame {
  return {
    players: [firstPlayer, secondPlayer],
    settings,
    teamScores: [0, 0],
    cycle,
    deck: buildPoetryDeck(cycle, settings.spice),
    cardIndex: 0,
    side: "front",
    poet: 0,
    round: 1,
    phase: "ready",
    score: 0,
    roundScore: 0,
    roundScores: [],
    deadline: null,
    lastMove: null,
  };
}

function moveToNextCard(
  game: PoetryGame,
  points: number,
  kind: PoetryMove["kind"],
  text: string,
): PoetryGame {
  return {
    ...game,
    score: game.score + points,
    teamScores: game.poet === 0
      ? [game.teamScores[0] + points, game.teamScores[1]]
      : [game.teamScores[0], game.teamScores[1] + points],
    roundScore: game.roundScore + points,
    cardIndex: (game.cardIndex + 1) % game.deck.length,
    side: "front",
    lastMove: { id: `${game.round}-${game.cardIndex}-${Date.now()}`, kind, points, text },
  };
}

export function applyPoetryAction(
  game: PoetryGame,
  actor: number,
  action: PoetryAction,
): PoetryGame {
  const isPoet = actor === game.poet;

  if (action.type === "startRound" && game.phase === "ready" && isPoet) {
    return {
      ...game,
      phase: "playing",
      deadline: action.now + game.settings.roundSeconds * 1000,
      lastMove: null,
    };
  }

  if (action.type === "flipCard" && game.phase === "playing" && isPoet) {
    return {
      ...game,
      side: game.side === "front" ? "back" : "front",
      lastMove: {
        id: `${game.round}-${game.cardIndex}-flip-${Date.now()}`,
        kind: "flip",
        points: 0,
        text: `${game.players[game.poet]} flipped the card`,
      },
    };
  }

  if (action.type === "scoreCard" && game.phase === "playing" && isPoet) {
    return moveToNextCard(
      game,
      action.points,
      "score",
      action.points === 3 ? "Full phrase! +3" : "Word found! +1",
    );
  }

  if (action.type === "bonk" && game.phase === "playing" && isPoet) {
    return moveToNextCard(game, -1, "bonk", "BONK! −1 and next card");
  }

  if (action.type === "endRound" && game.phase === "playing") {
    return { ...game, phase: "round-end", deadline: null };
  }

  if (action.type === "nextRound" && game.phase === "round-end") {
    const roundScores = [...game.roundScores, game.roundScore];
    if (game.round >= POETRY_TOTAL_ROUNDS) {
      return { ...game, phase: "finished", roundScores, deadline: null };
    }
    return {
      ...game,
      round: game.round + 1,
      poet: game.poet === 0 ? 1 : 0,
      phase: "ready",
      roundScore: 0,
      roundScores,
      deadline: null,
      side: "front",
      lastMove: null,
    };
  }

  return game;
}

export function poetryResult(score: number) {
  if (score >= 50) return "Much big brain";
  if (score >= 31) return "Strong word tribe";
  if (score >= 11) return "Not bad at word";
  return "Team need more cave time";
}
