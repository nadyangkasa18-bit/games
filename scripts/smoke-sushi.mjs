import assert from "node:assert/strict";
import {
  applySushiAction,
  createSushiGame,
  scoreSushiTableau,
  sushiViewFor,
} from "../lib/sushi-loop.ts";

const card = (id, kind) => ({ id, kind });
assert.equal(scoreSushiTableau([card("t1", "tempura"), card("t2", "tempura")]), 5);
assert.equal(scoreSushiTableau([card("s1", "sashimi"), card("s2", "sashimi"), card("s3", "sashimi")]), 10);
assert.equal(scoreSushiTableau([card("w", "wasabi"), card("n", "squid")]), 9);

let game = createSushiGame("Nadya", "Sister", 0);
assert.equal(game.hands[0].length, 10);
assert.equal(game.hands[1].length, 10);

const firstPick = game.hands[0][0].id;
const secondPick = game.hands[1][0].id;
game = applySushiAction(game, 0, { type: "select", cardId: firstPick });
assert.equal(game.selected[0], firstPick);
assert.equal(game.lastReveal, null, "a single locked pick must not reveal anything");

const guestView = sushiViewFor(game, 1);
assert.equal(guestView.hands[0].length, 0, "the opponent hand must be removed from the network view");
assert.equal(guestView.selected[0], "locked", "only the lock state may be shared");
assert.equal(guestView.selected[1], null);

game = applySushiAction(game, 1, { type: "select", cardId: secondPick });
assert.ok(game.lastReveal, "both confirmed picks should reveal together");
assert.equal(game.tableaus[0][0].id, firstPick);
assert.equal(game.tableaus[1][0].id, secondPick);
assert.equal(game.hands[0].length, 9);

while (game.phase === "drafting") {
  game = applySushiAction(game, 0, { type: "select", cardId: game.hands[0][0].id });
  game = applySushiAction(game, 1, { type: "select", cardId: game.hands[1][0].id });
}
assert.equal(game.phase, "round-score");
assert.equal(game.tableaus[0].length, 10);
game = applySushiAction(game, 0, { type: "nextRound" });
assert.equal(game.round, 2);
assert.equal(game.hands[0].length, 10);

console.log("Sushi Loop gameplay and privacy smoke test passed");
