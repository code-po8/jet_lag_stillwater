/**
 * Sync Service Abstraction (SYNC-001)
 *
 * A swappable real-time transport, mirroring the PersistenceService pattern.
 * The app is OFFLINE-FIRST: with no room joined, the default NoopSyncService is
 * active and the app behaves exactly as today (localStorage stays the source of
 * truth). When a room is joined, WsSyncService connects to the backend WS
 * gateway (INFRA-006). The store↔sync wiring lands in SYNC-002.
 */
import { ref, type Ref } from 'vue'
import type { ClientMessage, ServerMessage } from './protocol'

export type SyncStatus = 'disconnected' | 'connecting' | 'connected'

export interface ConnectOptions {
  /** WebSocket URL, e.g. wss://api.example.com/ws */
  url: string
  /** Room code to join. */
  code: string
  /** Rejoin token (sent in the first message, never in the URL). */
  rejoinToken: string
}

export type MessageHandler = (msg: ServerMessage) => void

/**
 * Transport interface. Implementations: NoopSyncService (offline default),
 * WsSyncService (real WebSocket).
 */
export interface SyncService {
  readonly status: Ref<SyncStatus>
  connect(options: ConnectOptions): Promise<void>
  disconnect(): void
  send(message: ClientMessage): void
  /** Subscribe to inbound server messages. Returns an unsubscribe function. */
  onMessage(handler: MessageHandler): () => void
}

/**
 * No-op transport — the default. The app runs fully locally/offline; nothing is
 * sent or received. Keeps single-device play working unchanged.
 */
export class NoopSyncService implements SyncService {
  readonly status = ref<SyncStatus>('disconnected')

  // Params are accepted to satisfy the interface but intentionally ignored.
  async connect(_options: ConnectOptions): Promise<void> {
    void _options // offline mode — nothing to do
  }
  disconnect(): void {}
  send(_message: ClientMessage): void {
    void _message
  }
  onMessage(_handler: MessageHandler): () => void {
    void _handler
    return () => {}
  }
}

/**
 * WebSocket transport to the backend gateway. Sends the hello handshake on open
 * (rejoin token in the first message, not the URL) and fans inbound frames out
 * to subscribers.
 */
export class WsSyncService implements SyncService {
  readonly status = ref<SyncStatus>('disconnected')
  private socket: WebSocket | null = null
  private handlers = new Set<MessageHandler>()
  private pending: ConnectOptions | null = null

  connect(options: ConnectOptions): Promise<void> {
    this.disconnect()
    this.pending = options
    this.status.value = 'connecting'

    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(options.url)
      this.socket = socket

      socket.onopen = () => {
        // Authenticate via the first message rather than the URL.
        this.send({ t: 'hello', code: options.code, rejoinToken: options.rejoinToken })
        this.status.value = 'connected'
        resolve()
      }
      socket.onerror = (err) => {
        if (this.status.value === 'connecting') reject(err)
      }
      socket.onclose = () => {
        this.status.value = 'disconnected'
      }
      socket.onmessage = (ev: MessageEvent) => {
        let msg: ServerMessage
        try {
          msg = JSON.parse(ev.data as string) as ServerMessage
        } catch {
          return // ignore malformed frames
        }
        for (const h of this.handlers) h(msg)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.onclose = null
      try {
        this.socket.close()
      } catch {
        // ignore
      }
      this.socket = null
    }
    this.pending = null
    this.status.value = 'disconnected'
  }

  send(message: ClientMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }
}

/** Factory mirroring createPersistenceService(). Defaults to offline (noop). */
export function createSyncService(kind: 'noop' | 'ws' = 'noop'): SyncService {
  return kind === 'ws' ? new WsSyncService() : new NoopSyncService()
}
