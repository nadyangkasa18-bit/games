import assert from "node:assert/strict";
import {
  applyPoetryAction,
  buildPoetryDeck,
  createPoetryGame,
} from "../lib/cave-poetry.ts";

const firstDeck = buildPoetryDeck(0);
const nextDeck = buildPoetryDeck(1);
assert.notEqual(firstDeck[0].id, nextDeck[0].id, "new games should open with a different word set");
assert.equal(new Set(firstDeck.map((card) => card.id)).size, firstDeck.length, "cards should not repeat within a deck");

let game = createPoetryGame("Nadya", "Sister", 0);
game = applyPoetryAction(game, 0, { type: "startRound", now: 1_000 });
assert.equal(game.phase, "playing");

const firstCard = game.cardIndex;
game = applyPoetryAction(game, 0, { type: "flipCard" });
assert.equal(game.side, "back", "the Poet can choose the back prompt");

game = applyPoetryAction(game, 0, { type: "bonk" });
assert.equal(game.score, -1, "Bonk should deduct one point");
assert.equal(game.cardIndex, firstCard + 1, "Bonk should immediately move to the next card");
assert.equal(game.side, "front", "the next card should start on its front");

game = applyPoetryAction(game, 0, { type: "scoreCard", points: 3 });
assert.equal(game.score, 2);
assert.equal(game.cardIndex, firstCard + 2);

console.log("Cave Poetry gameplay smoke test passed");
