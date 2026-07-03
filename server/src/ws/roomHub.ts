import {
  distanceMeters,
  type GamePhase,
  type Position,
  type PublicPlayer,
  type Role,
  type Zone,
} from '@jet-lag-stillwater/shared'

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
  private phaseStartedAt: number | null = null
  private paused = false
  // Server-authoritative pause accounting for the CURRENT phase. `pausedAccumMs`
  // is the sum of completed pause spans; `pausedAt` marks when the live pause
  // began (null when running). Both reset on every phase transition so timers
  // that key off `phaseStartedAt` measure only in-phase, un-paused time.
  private pausedAccumMs = 0
  private pausedAt: number | null = null

  constructor(code: string) {
    this.code = code
  }

  getPhase(): GamePhase {
    return this.phase
  }

  /** Server epoch ms when the current phase began (null in setup). */
  getPhaseStartedAt(): number | null {
    return this.phaseStartedAt
  }

  /**
   * Apply a host phase action. Host-authoritative: returns the new phase if the
   * actor is the host and the action maps to a transition, else null (ignored).
   * Records `now` (epoch ms; injectable for tests) as the phase-start instant so
   * clients can align timers to a single shared reference.
   */
  applyHostAction(actorId: string, action: string, now: number = Date.now()): GamePhase | null {
    const actor = this.membersById.get(actorId)
    if (!actor || !actor.isHost) return null
    const next = ACTION_TO_PHASE[action]
    if (!next) return null
    this.phase = next
    this.phaseStartedAt = now
    // A new phase starts un-paused with a fresh clock — clear pause accounting.
    this.paused = false
    this.pausedAccumMs = 0
    this.pausedAt = null
    return next
  }

  isPaused(): boolean {
    return this.paused
  }

  /** Completed paused ms this phase (excludes any live pause span). */
  getPausedAccumMs(): number {
    return this.pausedAccumMs
  }

  /** Server ms the current pause began, or null if running. */
  getPausedAt(): number | null {
    return this.pausedAt
  }

  /**
   * Apply a host pause/resume. Pause is orthogonal to the phase machine, so it
   * is tracked separately. On pause we record the instant; on resume we fold the
   * elapsed pause span into `pausedAccumMs`, so clients can freeze then continue
   * their timers server-authoritatively. Returns the new paused state if the
   * actor is the host and the state actually changed, else null (ignored).
   */
  applyHostPause(actorId: string, paused: boolean, now: number = Date.now()): boolean | null {
    const actor = this.membersById.get(actorId)
    if (!actor || !actor.isHost) return null
    if (this.paused === paused) return null
    this.paused = paused
    if (paused) {
      this.pausedAt = now
    } else if (this.pausedAt !== null) {
      this.pausedAccumMs += now - this.pausedAt
      this.pausedAt = null
    }
    return paused
  }

  /**
   * Host picks the hider: set the target to 'hider' and everyone else (incl. the
   * host) to 'seeker' — enforcing a single hider. Host-authoritative. Returns
   * the updated public roster to broadcast, or null if ignored (non-host actor
   * or unknown target).
   */
  setHider(actorId: string, targetId: string): PublicPlayer[] | null {
    const actor = this.membersById.get(actorId)
    if (!actor || !actor.isHost) return null
    if (!this.membersById.has(targetId)) return null
    for (const member of this.membersById.values()) {
      member.role = member.id === targetId ? 'hider' : 'seeker'
    }
    return this.publicMembers()
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
