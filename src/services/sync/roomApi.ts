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
    // Fail loudly on a production build with no API base (issue #3) rather than
    // POSTing same-origin to the static server → 405 / HTML parsed as JSON.
    if (isApiBaseMisconfigured()) {
      throw new RoomApiError(0, API_MISCONFIGURED_MESSAGE)
    }
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

/** True when the client is missing its API base in a production build. */
export function isApiBaseMisconfigured(): boolean {
  return import.meta.env.PROD && !getApiBaseUrl()
}

/**
 * Message for the VITE_API_URL misconfiguration (issue #3). Shown to the user
 * and thrown before any room request, so an empty base surfaces as a clear
 * error instead of a same-origin 405 / HTML-parsed-as-JSON.
 */
export const API_MISCONFIGURED_MESSAGE =
  'Server not configured: VITE_API_URL is missing from this build. Set it on ' +
  'the web service to the API URL and rebuild (see deploy/railway.md, issue #3).'

/**
 * WebSocket URL for the gateway, derived from the API base (http→ws, https→wss).
 * Falls back to same-origin `/ws` when no API base is configured.
 */
export function getWsUrl(): string {
  const base = getApiBaseUrl()
  if (!base) {
    // Same misconfiguration as the REST base (issue #3): a prod build must have
    // an API base — don't silently point the socket at the static origin.
    if (isApiBaseMisconfigured()) throw new Error(API_MISCONFIGURED_MESSAGE)
    if (typeof window === 'undefined') return '/ws'
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }
  return `${base.replace(/^http/, 'ws').replace(/\/+$/, '')}/ws`
}
