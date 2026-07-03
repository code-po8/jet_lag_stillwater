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

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

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
/** Reconnect backoff steps (ms). Caps at the last value. */
const RECONNECT_DELAYS_MS = [500, 1000, 2000, 5000, 10000]

export interface WsSyncOptions {
  /** Override reconnect backoff (tests use [0]). */
  reconnectDelaysMs?: number[]
  /** Auto-reconnect on unexpected close. Default true. */
  autoReconnect?: boolean
}

export class WsSyncService implements SyncService {
  readonly status = ref<SyncStatus>('disconnected')
  private socket: WebSocket | null = null
  private handlers = new Set<MessageHandler>()
  private pending: ConnectOptions | null = null
  private manualClose = false
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private readonly delays: number[]
  private readonly autoReconnect: boolean

  constructor(options: WsSyncOptions = {}) {
    this.delays = options.reconnectDelaysMs ?? RECONNECT_DELAYS_MS
    this.autoReconnect = options.autoReconnect ?? true
  }

  connect(options: ConnectOptions): Promise<void> {
    this.disconnect()
    this.manualClose = false
    this.pending = options
    this.reconnectAttempt = 0
    return this.open(options)
  }

  /** Open a socket for the given options (used by connect + reconnect). */
  private open(options: ConnectOptions): Promise<void> {
    this.status.value = this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting'

    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(options.url)
      this.socket = socket
      // Settle exactly once: a socket can close without ever firing `error`
      // (server refuses the upgrade, abrupt RST, browsers that emit only
      // `close`). Without this guard the initial-connect promise would hang
      // forever in that case. After it settles, reconnects run on their own.
      let settled = false
      const settleResolve = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const settleReject = (err: unknown) => {
        if (settled) return
        settled = true
        reject(err)
      }

      socket.onopen = () => {
        // Re-attach + reconcile: the server replies with a fresh `welcome`.
        this.send({ t: 'hello', code: options.code, rejoinToken: options.rejoinToken })
        this.status.value = 'connected'
        this.reconnectAttempt = 0
        settleResolve()
      }
      socket.onerror = (err) => {
        settleReject(err)
      }
      socket.onclose = () => {
        this.socket = null
        // A close before the promise settled means the initial connect failed
        // (e.g. no prior `error` event) — reject so the caller doesn't hang.
        settleReject(new Error('WebSocket closed before connecting'))
        if (this.manualClose || !this.autoReconnect || !this.pending) {
          this.status.value = 'disconnected'
          return
        }
        this.scheduleReconnect()
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

  /** Schedule the next reconnect attempt with capped backoff. */
  private scheduleReconnect(): void {
    this.status.value = 'reconnecting'
    const delay = this.delays[Math.min(this.reconnectAttempt, this.delays.length - 1)]!
    this.reconnectAttempt++
    this.reconnectTimer = setTimeout(() => {
      if (this.pending && !this.manualClose) {
        this.open(this.pending).catch(() => {
          // open() rejects only on the initial-connect path; the onclose handler
          // schedules the next retry.
        })
      }
    }, delay)
  }

  disconnect(): void {
    this.manualClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
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
    this.reconnectAttempt = 0
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
export function createSyncService(
  kind: 'noop' | 'ws' = 'noop',
  options?: WsSyncOptions,
): SyncService {
  return kind === 'ws' ? new WsSyncService(options) : new NoopSyncService()
}
