export type PeerData = Record<string, unknown>;

export interface PeerConnection {
  open: boolean;
  send(data: PeerData): void;
  close(): void;
  on(event: "open" | "close" | "error", callback: (error?: unknown) => void): void;
  on(event: "data", callback: (data: PeerData) => void): void;
}

export interface PeerInstance {
  connect(id: string, options?: Record<string, unknown>): PeerConnection;
  destroy(): void;
  on(event: "open", callback: (id: string) => void): void;
  on(event: "connection", callback: (connection: PeerConnection) => void): void;
  on(event: "error" | "close" | "disconnected", callback: (error?: unknown) => void): void;
}

declare global {
  interface Window {
    Peer: new (id?: string, options?: Record<string, unknown>) => PeerInstance;
  }
}
