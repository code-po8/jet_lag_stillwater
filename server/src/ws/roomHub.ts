import type { GamePhase, Position, PublicPlayer, Role, Zone } from '@shared'

/** Host action → resulting phase (host-authoritative transitions). */
const ACTION_TO_PHASE: Record<string, GamePhase> = {
  'start-hiding': 'hiding-period',
  'start-seeking': 'seeking',
  'end-round': 'round-complete',
}

interface Member {
  id: string
  name: string
  role: Role
  isHost: boolean
  connected: boolean
}

interface MemberInput {
  id: string
  name: string
  role: Role
  isHost: boolean
}

/** Great-circle distance in meters between two lat/lng points (haversine). */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000 // Earth radius (m)
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * In-memory state for one room (INFRA-006). Holds connected members, the latest
 * position per player, the hiding zone, and ruled-out cells. Positions are NEVER
 * persisted. Pure logic (no sockets) so it is unit-testable; the WS gateway owns
 * the transport and calls into this.
 *
 * Security: `positionBatchFor(viewerId)` enforces that seekers never receive the
 * hider's position — withholding happens here, at the data layer, not in the UI.
 */
export class RoomHub {
  readonly code: string
  private membersById = new Map<string, Member>()
  private positions = new Map<string, Position>()
  private zone: Zone | null = null
  private ruledOut = new Set<string>()
  private breached = new Set<string>()
  private phase: GamePhase = 'setup'

  constructor(code: string) {
    this.code = code
  }

  getPhase(): GamePhase {
    return this.phase
  }

  /**
   * Apply a host phase action. Host-authoritative: returns the new phase if the
   * actor is the host and the action maps to a transition, else null (ignored).
   */
  applyHostAction(actorId: string, action: string): GamePhase | null {
    const actor = this.membersById.get(actorId)
    if (!actor || !actor.isHost) return null
    const next = ACTION_TO_PHASE[action]
    if (!next) return null
    this.phase = next
    return next
  }

  addMember(input: MemberInput): void {
    this.membersById.set(input.id, { ...input, connected: true })
  }

  removeMember(id: string): void {
    this.membersById.delete(id)
    this.positions.delete(id)
    this.breached.delete(id)
  }

  setConnected(id: string, connected: boolean): void {
    const m = this.membersById.get(id)
    if (m) m.connected = connected
  }

  members(): Member[] {
    return [...this.membersById.values()]
  }

  publicMembers(): PublicPlayer[] {
    return this.members().map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      isHost: m.isHost,
      connected: m.connected,
    }))
  }

  isEmpty(): boolean {
    return this.membersById.size === 0
  }

  private hiderId(): string | undefined {
    return this.members().find((m) => m.role === 'hider')?.id
  }

  /**
   * Record a player's latest position. Returns true if this update constitutes
   * a NEW zone breach (a seeker crossing into the zone for the first time).
   */
  updatePosition(id: string, pos: Position): boolean {
    this.positions.set(id, pos)

    const member = this.membersById.get(id)
    if (!member || member.role !== 'seeker' || !this.zone) return false
    if (this.breached.has(id)) return false

    const dist = distanceMeters(pos.lat, pos.lng, this.zone.lat, this.zone.lng)
    if (dist <= this.zone.radiusM) {
      this.breached.add(id)
      return true
    }
    return false
  }

  /**
   * Latest position of every OTHER player visible to `viewerId`:
   *  - excludes the viewer's own position
   *  - excludes the hider's position when the viewer is a seeker (withholding)
   */
  positionBatchFor(viewerId: string): Array<{ playerId: string; pos: Position }> {
    const viewer = this.membersById.get(viewerId)
    const hiderId = this.hiderId()
    const viewerIsSeeker = viewer?.role === 'seeker'

    const out: Array<{ playerId: string; pos: Position }> = []
    for (const [playerId, pos] of this.positions) {
      if (playerId === viewerId) continue
      if (viewerIsSeeker && playerId === hiderId) continue // withhold hider
      out.push({ playerId, pos })
    }
    return out
  }

  setZone(zone: Zone | null): void {
    this.zone = zone
    // A new zone resets breach tracking.
    this.breached.clear()
  }

  getZone(): Zone | null {
    return this.zone
  }

  breachedSeekers(): string[] {
    return [...this.breached]
  }

  addRuledOutCells(cells: string[]): void {
    for (const c of cells) this.ruledOut.add(c)
  }

  ruledOutCells(): string[] {
    return [...this.ruledOut]
  }
}
