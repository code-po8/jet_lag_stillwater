/**
 * REST client for the room control-plane (INFRA-005 endpoints).
 * Used by the lobby/room flow (MULTI-002). The WebSocket data-plane is separate
 * (SyncService / SYNC-001).
 */
import type { PublicPlayer } from './protocol'

export interface CreateRoomResponse {
  code: string
  sessionId: string
  player: PublicPlayer
  rejoinToken: string
}

export interface RoomInfo {
  code: string
  phase: string
  status: string
  players: PublicPlayer[]
}

export interface JoinResponse {
  player: PublicPlayer
  rejoinToken: string
}

export interface RejoinResponse {
  player: PublicPlayer
}

/** Error carrying the HTTP status + server-provided message. */
export class RoomApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'RoomApiError'
  }

  get notFound(): boolean {
    return this.status === 404
  }
}

export class RoomApi {
  private base: string

  constructor(baseUrl: string) {
    this.base = baseUrl.replace(/\/+$/, '')
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { 'content-type': 'application/json' },
      ...init,
    })
    if (!res.ok) {
      let message = `request failed (${res.status})`
      try {
        const body = (await res.json()) as { error?: string }
        if (body?.error) message = body.error
      } catch {
        // ignore body parse failure
      }
      throw new RoomApiError(res.status, message)
    }
    return (await res.json()) as T
  }

  createRoom(name: string): Promise<CreateRoomResponse> {
    return this.request<CreateRoomResponse>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  getRoom(code: string): Promise<RoomInfo> {
    return this.request<RoomInfo>(`/rooms/${code.toUpperCase()}`)
  }

  joinRoom(code: string, name: string): Promise<JoinResponse> {
    return this.request<JoinResponse>(`/rooms/${code.toUpperCase()}/join`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  rejoinRoom(code: string, rejoinToken: string): Promise<RejoinResponse> {
    return this.request<RejoinResponse>(`/rooms/${code.toUpperCase()}/rejoin`, {
      method: 'POST',
      body: JSON.stringify({ rejoinToken }),
    })
  }
}

/** API base URL from build-time env, falling back to same-origin in dev. */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  return fromEnv ?? ''
}
