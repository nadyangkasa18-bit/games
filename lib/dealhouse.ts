export type GroupId = "slate" | "sky" | "rose" | "amber" | "mint" | "violet" | "transit";

export type PropertyCard = {
  id: string;
  kind: "property";
  name: string;
  group: GroupId;
  value: number;
};

export type MoneyCard = {
  id: string;
  kind: "money";
  name: string;
  value: number;
};

export type ActionKind = "draw2" | "rent" | "collect" | "steal" | "swap";

export type ActionCard = {
  id: string;
  kind: "action";
  action: ActionKind;
  name: string;
  body: string;
  value: number;
};

export type DealCard = PropertyCard | MoneyCard | ActionCard;

export type DealPlayer = {
  id: number;
  name: string;
  hand: DealCard[];
  bank: DealCard[];
  properties: Record<GroupId, PropertyCard[]>;
};

export type DealActivity = {
  id: string;
  actor: number;
  title: string;
  detail: string;
  visual: "card" | "money" | "property" | "turn";
};

export type PendingPayment = {
  from: number;
  to: number;
  amount: number;
  reason: string;
  selectedAssetIds: string[];
};

export type DealState = {
  players: [DealPlayer, DealPlayer];
  deck: DealCard[];
  discard: DealCard[];
  currentPlayer: number;
  turn: number;
  actionsLeft: number;
  phase: "playing" | "paying" | "discarding" | "over";
  pendingPayment?: PendingPayment;
  activities: DealActivity[];
  winner?: number;
  revision: number;
};

export type DealAction =
  | { type: "bankCard"; cardId: string }
  | { type: "playProperty"; cardId: string }
  | { type: "playAction"; cardId: string; group?: GroupId; targetCardId?: string; ownCardId?: string }
  | { type: "endTurn" }
  | { type: "discardCard"; cardId: string }
  | { type: "togglePayment"; cardId: string }
  | { type: "confirmPayment" };

export type EngineResult = { ok: true; state: DealState } | { ok: false; state: DealState; error: string };

export const GROUPS: Record<GroupId, { name: string; size: number; rents: number[] }> = {
  slate: { name: "Old Quarter", size: 2, rents: [1, 2] },
  sky: { name: "Glass Harbor", size: 3, rents: [1, 2, 4] },
  rose: { name: "Rose Row", size: 3, rents: [1, 2, 4] },
  amber: { name: "Golden Mile", size: 3, rents: [1, 3, 5] },
  mint: { name: "Garden Ward", size: 3, rents: [1, 3, 5] },
  violet: { name: "Night Market", size: 2, rents: [2, 5] },
  transit: { name: "Metro Line", size: 4, rents: [1, 2, 3, 4] },
};

export const GROUP_ORDER = Object.keys(GROUPS) as GroupId[];

function blankProperties(): Record<GroupId, PropertyCard[]> {
  return { slate: [], sky: [], rose: [], amber: [], mint: [], violet: [], transit: [] };
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildDeck(): DealCard[] {
  let serial = 0;
  const nextId = (prefix: string) => `${prefix}-${serial++}`;
  const cards: DealCard[] = [];

  GROUP_ORDER.forEach((group) => {
    const config = GROUPS[group];
    for (let index = 0; index < config.size; index += 1) {
      cards.push({
        id: nextId(`property-${group}`),
        kind: "property",
        group,
        name: `${config.name} ${index + 1}`,
        value: group === "violet" ? 4 : group === "transit" ? 2 : 3,
      });
    }
  });

  ([1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5] as number[]).forEach((value) => {
    cards.push({ id: nextId("money"), kind: "money", name: `${value}M note`, value });
  });

  const actions: Array<Omit<ActionCard, "id" | "kind"> & { count: number }> = [
    { action: "draw2", name: "Fresh Lead", body: "Draw two more cards.", value: 1, count: 6 },
    { action: "rent", name: "Rent Day", body: "Collect rent for one district you own.", value: 1, count: 6 },
    { action: "collect", name: "Service Fee", body: "Collect 2M from your rival.", value: 2, count: 4 },
    { action: "steal", name: "Quiet Acquisition", body: "Take one property from an incomplete district.", value: 3, count: 4 },
    { action: "swap", name: "Trade Places", body: "Swap one property with your rival.", value: 3, count: 3 },
  ];

  actions.forEach(({ count, ...card }) => {
    for (let index = 0; index < count; index += 1) {
      cards.push({ ...card, id: nextId(`action-${card.action}`), kind: "action" });
    }
  });

  return shuffle(cards);
}

function cloneState(state: DealState): DealState {
  return JSON.parse(JSON.stringify(state)) as DealState;
}

function addActivity(state: DealState, activity: Omit<DealActivity, "id">) {
  state.revision += 1;
  state.activities.unshift({ ...activity, id: `move-${state.turn}-${state.revision}` });
  state.activities = state.activities.slice(0, 10);
}

function refillDeck(state: DealState) {
  if (state.deck.length === 0 && state.discard.length > 0) {
    state.deck = shuffle(state.discard);
    state.discard = [];
  }
}

function drawCards(state: DealState, playerIndex: number, count: number) {
  for (let index = 0; index < count; index += 1) {
    refillDeck(state);
    const card = state.deck.pop();
    if (!card) return;
    state.players[playerIndex].hand.push(card);
  }
}

export function createDealGame(firstName: string, secondName: string): DealState {
  const state: DealState = {
    players: [
      { id: 0, name: firstName, hand: [], bank: [], properties: blankProperties() },
      { id: 1, name: secondName, hand: [], bank: [], properties: blankProperties() },
    ],
    deck: buildDeck(),
    discard: [],
    currentPlayer: 0,
    turn: 1,
    actionsLeft: 3,
    phase: "playing",
    activities: [],
    revision: 0,
  };

  for (let round = 0; round < 5; round += 1) {
    drawCards(state, 0, 1);
    drawCards(state, 1, 1);
  }
  drawCards(state, 0, 2);
  addActivity(state, {
    actor: 0,
    title: `${state.players[0].name} opens the table`,
    detail: "Three moves available.",
    visual: "turn",
  });
  return state;
}

export function bankTotal(player: DealPlayer) {
  return player.bank.reduce((sum, card) => sum + card.value, 0);
}

export function groupIsComplete(player: DealPlayer, group: GroupId) {
  return player.properties[group].length >= GROUPS[group].size;
}

export function completedGroups(player: DealPlayer) {
  return GROUP_ORDER.filter((group) => groupIsComplete(player, group)).length;
}

export function rentFor(player: DealPlayer, group: GroupId) {
  const count = Math.min(player.properties[group].length, GROUPS[group].size);
  return count > 0 ? GROUPS[group].rents[count - 1] : 0;
}

export function paymentAssets(player: DealPlayer) {
  const bank = player.bank.map((card) => ({ card, zone: "bank" as const }));
  const properties = GROUP_ORDER.flatMap((group) => player.properties[group].map((card) => ({ card, zone: "property" as const })));
  return [...bank, ...properties];
}

function fail(state: DealState, error: string): EngineResult {
  return { ok: false, state, error };
}

function finishIfWon(state: DealState, playerIndex: number) {
  if (completedGroups(state.players[playerIndex]) < 3) return false;
  state.phase = "over";
  state.winner = playerIndex;
  addActivity(state, {
    actor: playerIndex,
    title: `${state.players[playerIndex].name} completes the city`,
    detail: "Three full districts. Game won.",
    visual: "property",
  });
  return true;
}

function advanceTurn(state: DealState) {
  if (state.phase === "over") return;
  state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
  state.turn += 1;
  state.actionsLeft = 3;
  state.phase = "playing";
  state.pendingPayment = undefined;
  drawCards(state, state.currentPlayer, 2);
  addActivity(state, {
    actor: state.currentPlayer,
    title: `${state.players[state.currentPlayer].name}'s turn`,
    detail: "Two cards drawn. Three moves ready.",
    visual: "turn",
  });
}

function spendAction(state: DealState) {
  state.actionsLeft = Math.max(0, state.actionsLeft - 1);
  if (state.actionsLeft === 0 && !state.pendingPayment && state.phase === "playing") advanceTurn(state);
}

function startPayment(state: DealState, from: number, to: number, amount: number, reason: string) {
  const available = paymentAssets(state.players[from]);
  if (available.length === 0 || amount <= 0) {
    addActivity(state, {
      actor: from,
      title: `${state.players[from].name} has nothing to pay`,
      detail: `${reason} resolves with no transfer.`,
      visual: "money",
    });
    return;
  }
  state.pendingPayment = { from, to, amount, reason, selectedAssetIds: [] };
  state.phase = "paying";
}

function takeHandCard(player: DealPlayer, cardId: string) {
  const index = player.hand.findIndex((card) => card.id === cardId);
  if (index < 0) return undefined;
  return player.hand.splice(index, 1)[0];
}

function locateProperty(player: DealPlayer, cardId: string) {
  for (const group of GROUP_ORDER) {
    const index = player.properties[group].findIndex((card) => card.id === cardId);
    if (index >= 0) return { group, index, card: player.properties[group][index] };
  }
  return undefined;
}

function playActionCard(state: DealState, actor: number, action: Extract<DealAction, { type: "playAction" }>): EngineResult {
  const player = state.players[actor];
  const opponentIndex = actor === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];
  const handCard = player.hand.find((card) => card.id === action.cardId);
  if (!handCard || handCard.kind !== "action") return fail(state, "That action card is no longer in your hand.");

  if (handCard.action === "rent") {
    if (!action.group || player.properties[action.group].length === 0) return fail(state, "Choose a district you own to collect rent.");
  }
  if (handCard.action === "steal") {
    if (!action.targetCardId) return fail(state, "Choose a rival property to acquire.");
    const target = locateProperty(opponent, action.targetCardId);
    if (!target || groupIsComplete(opponent, target.group)) return fail(state, "Completed districts are protected.");
  }
  if (handCard.action === "swap") {
    if (!action.targetCardId || !action.ownCardId) return fail(state, "Choose one property from each side.");
    const theirs = locateProperty(opponent, action.targetCardId);
    const yours = locateProperty(player, action.ownCardId);
    if (!theirs || !yours || groupIsComplete(opponent, theirs.group) || groupIsComplete(player, yours.group)) {
      return fail(state, "Only properties in incomplete districts can be traded.");
    }
  }

  const card = takeHandCard(player, action.cardId) as ActionCard;
  state.discard.push(card);

  if (card.action === "draw2") {
    drawCards(state, actor, 2);
    addActivity(state, { actor, title: `${player.name} follows a fresh lead`, detail: "Two cards added to hand.", visual: "card" });
  }

  if (card.action === "collect") {
    addActivity(state, { actor, title: `${player.name} charges a service fee`, detail: `${opponent.name} owes 2M.`, visual: "money" });
    startPayment(state, opponentIndex, actor, 2, "Service Fee");
  }

  if (card.action === "rent" && action.group) {
    const amount = rentFor(player, action.group);
    addActivity(state, { actor, title: `${player.name} collects rent`, detail: `${GROUPS[action.group].name} is worth ${amount}M.`, visual: "money" });
    startPayment(state, opponentIndex, actor, amount, `${GROUPS[action.group].name} rent`);
  }

  if (card.action === "steal" && action.targetCardId) {
    const target = locateProperty(opponent, action.targetCardId)!;
    const [property] = opponent.properties[target.group].splice(target.index, 1);
    player.properties[property.group].push(property);
    addActivity(state, { actor, title: `${player.name} makes a quiet acquisition`, detail: `${GROUPS[property.group].name} crosses the table.`, visual: "property" });
    finishIfWon(state, actor);
  }

  if (card.action === "swap" && action.targetCardId && action.ownCardId) {
    const theirs = locateProperty(opponent, action.targetCardId)!;
    const yours = locateProperty(player, action.ownCardId)!;
    const [theirCard] = opponent.properties[theirs.group].splice(theirs.index, 1);
    const [yourCard] = player.properties[yours.group].splice(yours.index, 1);
    player.properties[theirCard.group].push(theirCard);
    opponent.properties[yourCard.group].push(yourCard);
    addActivity(state, { actor, title: `${player.name} trades places`, detail: "Two properties swap sides live.", visual: "property" });
    if (!finishIfWon(state, actor)) finishIfWon(state, opponentIndex);
  }

  if (state.phase !== "over") spendAction(state);
  return { ok: true, state };
}

export function applyDealAction(source: DealState, actor: number, action: DealAction): EngineResult {
  const state = cloneState(source);

  if (state.phase === "over") return fail(source, "This game is already over.");

  if (state.phase === "paying") {
    const payment = state.pendingPayment;
    if (!payment || actor !== payment.from) return fail(source, "The other player is choosing a payment.");
    const assets = paymentAssets(state.players[actor]);

    if (action.type === "togglePayment") {
      if (!assets.some(({ card }) => card.id === action.cardId)) return fail(source, "That card is no longer available.");
      const selectedIndex = payment.selectedAssetIds.indexOf(action.cardId);
      if (selectedIndex >= 0) payment.selectedAssetIds.splice(selectedIndex, 1);
      else payment.selectedAssetIds.push(action.cardId);
      state.revision += 1;
      return { ok: true, state };
    }

    if (action.type === "confirmPayment") {
      const totalAvailable = assets.reduce((sum, { card }) => sum + card.value, 0);
      const required = Math.min(payment.amount, totalAvailable);
      const selected = assets.filter(({ card }) => payment.selectedAssetIds.includes(card.id));
      const selectedValue = selected.reduce((sum, { card }) => sum + card.value, 0);
      if (selectedValue < required) return fail(source, `Select at least ${required}M to pay.`);

      selected.forEach(({ card, zone }) => {
        if (zone === "bank") {
          const bankIndex = state.players[actor].bank.findIndex((item) => item.id === card.id);
          const [paid] = state.players[actor].bank.splice(bankIndex, 1);
          state.players[payment.to].bank.push(paid);
        } else {
          const located = locateProperty(state.players[actor], card.id);
          if (!located) return;
          const [paid] = state.players[actor].properties[located.group].splice(located.index, 1);
          state.players[payment.to].properties[paid.group].push(paid);
        }
      });

      state.pendingPayment = undefined;
      state.phase = "playing";
      addActivity(state, {
        actor,
        title: `${state.players[actor].name} pays ${selectedValue}M`,
        detail: `${selected.length} card${selected.length === 1 ? "" : "s"} slide across the table.`,
        visual: "money",
      });
      if (!finishIfWon(state, payment.to) && state.actionsLeft === 0) advanceTurn(state);
      return { ok: true, state };
    }

    return fail(source, "Finish the payment before taking another action.");
  }

  if (state.phase === "discarding") {
    if (actor !== state.currentPlayer || action.type !== "discardCard") return fail(source, "The current player must discard down to seven cards.");
    const card = takeHandCard(state.players[actor], action.cardId);
    if (!card) return fail(source, "That card is no longer in your hand.");
    state.discard.push(card);
    addActivity(state, { actor, title: `${state.players[actor].name} trims their hand`, detail: "One card discarded face-down.", visual: "card" });
    if (state.players[actor].hand.length <= 7) advanceTurn(state);
    return { ok: true, state };
  }

  if (actor !== state.currentPlayer) return fail(source, "Wait for your turn.");

  const player = state.players[actor];

  if (action.type === "endTurn") {
    if (player.hand.length > 7) {
      state.phase = "discarding";
      addActivity(state, { actor, title: `${player.name} has too many cards`, detail: "Discard down to seven before passing the turn.", visual: "card" });
    } else {
      advanceTurn(state);
    }
    return { ok: true, state };
  }

  if (action.type === "bankCard") {
    const card = player.hand.find((item) => item.id === action.cardId);
    if (!card || card.kind === "property") return fail(source, "Property cards must be placed in a district.");
    const banked = takeHandCard(player, action.cardId)!;
    player.bank.push(banked);
    addActivity(state, { actor, title: `${player.name} banks ${banked.value}M`, detail: "A card lands in the vault.", visual: "money" });
    spendAction(state);
    return { ok: true, state };
  }

  if (action.type === "playProperty") {
    const card = player.hand.find((item) => item.id === action.cardId);
    if (!card || card.kind !== "property") return fail(source, "Choose a property card.");
    const property = takeHandCard(player, action.cardId) as PropertyCard;
    player.properties[property.group].push(property);
    addActivity(state, { actor, title: `${player.name} builds in ${GROUPS[property.group].name}`, detail: `${player.properties[property.group].length}/${GROUPS[property.group].size} properties complete.`, visual: "property" });
    if (!finishIfWon(state, actor)) spendAction(state);
    return { ok: true, state };
  }

  if (action.type === "playAction") return playActionCard(state, actor, action);

  return fail(source, "That move is not available right now.");
}
