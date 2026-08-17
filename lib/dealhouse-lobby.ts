export type DealLobbyScreen =
  | "menu"
  | "host"
  | "join"
  | "client-wait"
  | "game";

export function isDealLobbyWaiting(screen: DealLobbyScreen) {
  return screen === "host" || screen === "client-wait";
}
