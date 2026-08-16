import assert from "node:assert/strict";
import {
  applyPoetryAction,
  buildPoetryDeck,
  createPoetryGame,
} from "../lib/cave-poetry.ts";

const firstDeck = buildPoetryDeck(0);
const nextDeck = buildPoetryDeck(1);
const spicyDeck = buildPoetryDeck(0, "spicy");
assert.notEqual(firstDeck[0].id, nextDeck[0].id, "new games should open with a different word set");
assert.equal(new Set(firstDeck.map((card) => card.id)).size, firstDeck.length, "cards should not repeat within a deck");
assert.ok(spicyDeck.some((card) => card.id.startsWith("spicy-")), "the spicy setting should include 18+ prompts");

let game = createPoetryGame("Nadya", "Sister", 0, {
  teamNames: ["Team Stone", "Team Flame"],
  spice: "spicy",
  roundSeconds: 60,
});
game = applyPoetryAction(game, 0, { type: "startRound", now: 1_000 });
assert.equal(game.phase, "playing");
assert.equal(game.deadline, 61_000, "the selected round duration should control the timer");

const firstCard = game.cardIndex;
game = applyPoetryAction(game, 0, { type: "flipCard" });
assert.equal(game.side, "back", "the Poet can choose the back prompt");

game = applyPoetryAction(game, 0, { type: "bonk" });
assert.equal(game.score, -1, "Bonk should deduct one point");
assert.deepEqual(game.teamScores, [-1, 0], "Bonk should deduct from the active team");
assert.equal(game.cardIndex, firstCard + 1, "Bonk should immediately move to the next card");
assert.equal(game.side, "front", "the next card should start on its front");

game = applyPoetryAction(game, 0, { type: "scoreCard", points: 3 });
assert.equal(game.score, 2);
assert.equal(game.cardIndex, firstCard + 2);

console.log("Cave Poetry gameplay smoke test passed");
