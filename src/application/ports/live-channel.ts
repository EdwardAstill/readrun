export interface LiveEvent {
  type:
    | "connected"
    | "snapshot"
    | "content-changed"
    | "reload"
    | "error";
  at: number;
  version?: number;
  relPath?: string;
  url?: string;
  reason?: string;
  message?: string;
}

export interface LiveChannel {
  publish(event: LiveEvent): void;
  subscribe(listener: (event: LiveEvent) => void): () => void;
}
