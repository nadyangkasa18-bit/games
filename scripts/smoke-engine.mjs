import assert from "node:assert/strict";
import {
  applyDealAction,
  completedGroups,
  createDealGame,
} from "../lib/dealhouse.ts";
import { isDealLobbyWaiting } from "../lib/dealhouse-lobby.ts";

assert.equal(
  isDealLobbyWaiting("join"),
  false,
  "the guest should see the room-code form before joining",
);
assert.equal(
  isDealLobbyWaiting("client-wait"),
  true,
  "the guest should see the waiting state after submitting a room code",
);

function card(id, kind, extra = {}) {
  return { id, kind, name: id, value: 2, ...extra };
}

let game = createDealGame("Nadya", "Sister");
assert.equal(game.players[0].hand.length, 7);
assert.equal(game.players[1].hand.length, 5);
assert.equal(game.actionsLeft, 3);

game.players[0].hand = [card("note", "money")];
let result = applyDealAction(game, 0, { type: "bankCard", cardId: "note" });
assert.equal(result.ok, true);
if (!result.ok) process.exit(1);
game = result.state;
assert.equal(game.players[0].bank.length, 1);
assert.equal(game.actionsLeft, 2);

game.players[0].hand = [card("fee", "action", { action: "collect", body: "Collect", value: 2 })];
game.players[1].bank = [card("payment", "money", { value: 3 })];
result = applyDealAction(game, 0, { type: "playAction", cardId: "fee" });
assert.equal(result.ok, true);
if (!result.ok) process.exit(1);
game = result.state;
assert.equal(game.phase, "paying");

result = applyDealAction(game, 1, { type: "togglePayment", cardId: "payment" });
assert.equal(result.ok, true);
if (!result.ok) process.exit(1);
game = result.state;
result = applyDealAction(game, 1, { type: "confirmPayment" });
assert.equal(result.ok, true);
if (!result.ok) process.exit(1);
game = result.state;
assert.equal(game.players[0].bank.some((item) => item.id === "payment"), true);
assert.equal(game.phase, "playing");

game.players[0].properties.slate = [
  card("slate-1", "property", { group: "slate", value: 2 }),
  card("slate-2", "property", { group: "slate", value: 2 }),
];
game.players[0].properties.violet = [
  card("violet-1", "property", { group: "violet", value: 4 }),
  card("violet-2", "property", { group: "violet", value: 4 }),
];
game.players[0].properties.sky = [
  card("sky-1", "property", { group: "sky", value: 3 }),
  card("sky-2", "property", { group: "sky", value: 3 }),
];
game.players[0].hand = [card("sky-3", "property", { group: "sky", value: 3 })];
game.currentPlayer = 0;
game.phase = "playing";
game.actionsLeft = 1;
result = applyDealAction(game, 0, { type: "playProperty", cardId: "sky-3" });
assert.equal(result.ok, true);
if (!result.ok) process.exit(1);
game = result.state;
assert.equal(completedGroups(game.players[0]), 3);
assert.equal(game.phase, "over");
assert.equal(game.winner, 0);

console.log("Dealhouse engine smoke test passed");
