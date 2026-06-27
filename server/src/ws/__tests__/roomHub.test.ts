import { describe, it, expect, beforeEach } from 'vitest'
import { RoomHub } from '../roomHub.js'
import type { Position, Zone } from '@shared'

const hiderPlayer = { id: 'h1', name: 'Hank', role: 'hider' as const, isHost: true }
const seekerPlayer = { id: 's1', name: 'Sue', role: 'seeker' as const, isHost: false }
const seeker2 = { id: 's2', name: 'Sam', role: 'seeker' as const, isHost: false }

function pos(lat: number, lng: number): Position {
  return { lat, lng, ts: 1000 }
}

describe('RoomHub membership', () => {
  let hub: RoomHub
  beforeEach(() => {
    hub = new RoomHub('ABCD')
  })

  it('adds and lists members', () => {
    hub.addMember(hiderPlayer)
    hub.addMember(seekerPlayer)
    expect(
      hub
        .members()
        .map((m) => m.id)
        .sort(),
    ).toEqual(['h1', 's1'])
  })

  it('marks a member connected on add', () => {
    hub.addMember(seekerPlayer)
    expect(hub.members()[0]!.connected).toBe(true)
  })

  it('removes a member', () => {
    hub.addMember(seekerPlayer)
    hub.removeMember('s1')
    expect(hub.members()).toHaveLength(0)
  })

  it('reports emptiness', () => {
    expect(hub.isEmpty()).toBe(true)
    hub.addMember(seekerPlayer)
    expect(hub.isEmpty()).toBe(false)
  })
})

describe('RoomHub position coalescing', () => {
  let hub: RoomHub
  beforeEach(() => {
    hub = new RoomHub('ABCD')
    hub.addMember(hiderPlayer)
    hub.addMember(seekerPlayer)
  })

  it('keeps only the latest position per player', () => {
    hub.updatePosition('s1', pos(36.1, -97.0))
    hub.updatePosition('s1', pos(36.2, -97.1))
    const batch = hub.positionBatchFor('h1')
    const s1 = batch.find((b) => b.playerId === 's1')
    expect(s1!.pos.lat).toBe(36.2)
  })
})

describe('RoomHub hider-position withholding', () => {
  let hub: RoomHub
  beforeEach(() => {
    hub = new RoomHub('ABCD')
    hub.addMember(hiderPlayer)
    hub.addMember(seekerPlayer)
    hub.updatePosition('h1', pos(36.12, -97.07)) // hider location
    hub.updatePosition('s1', pos(36.1, -97.0)) // seeker location
  })

  it('a SEEKER never receives the hider position', () => {
    const batch = hub.positionBatchFor('s1')
    expect(batch.find((b) => b.playerId === 'h1')).toBeUndefined()
  })

  it('a SEEKER still receives other seekers', () => {
    hub.addMember(seeker2)
    hub.updatePosition('s2', pos(36.11, -97.01))
    const batch = hub.positionBatchFor('s1')
    expect(batch.find((b) => b.playerId === 's2')).toBeDefined()
  })

  it('the HIDER receives seeker positions', () => {
    const batch = hub.positionBatchFor('h1')
    expect(batch.find((b) => b.playerId === 's1')).toBeDefined()
  })

  it('the HIDER does not get their own position echoed', () => {
    const batch = hub.positionBatchFor('h1')
    expect(batch.find((b) => b.playerId === 'h1')).toBeUndefined()
  })
})

describe('RoomHub zone + breach', () => {
  let hub: RoomHub
  const zone: Zone = { lat: 36.12, lng: -97.07, radiusM: 402 }
  beforeEach(() => {
    hub = new RoomHub('ABCD')
    hub.addMember(hiderPlayer)
    hub.addMember(seekerPlayer)
    hub.setZone(zone)
  })

  it('stores and returns the zone', () => {
    expect(hub.getZone()).toEqual(zone)
  })

  it('detects a breach when a seeker is inside the zone radius', () => {
    // ~same point as the zone center → inside
    const breached = hub.updatePosition('s1', pos(36.12, -97.07))
    expect(breached).toBe(true)
    expect(hub.breachedSeekers()).toContain('s1')
  })

  it('does not breach when the seeker is far outside the radius', () => {
    const breached = hub.updatePosition('s1', pos(36.3, -97.3))
    expect(breached).toBe(false)
    expect(hub.breachedSeekers()).not.toContain('s1')
  })

  it('a hider inside their own zone is never a breach', () => {
    const breached = hub.updatePosition('h1', pos(36.12, -97.07))
    expect(breached).toBe(false)
  })

  it('reports breach only once per seeker (no duplicate events)', () => {
    expect(hub.updatePosition('s1', pos(36.12, -97.07))).toBe(true)
    // staying inside should not re-fire
    expect(hub.updatePosition('s1', pos(36.1201, -97.0701))).toBe(false)
  })
})

describe('RoomHub phase (host-authoritative)', () => {
  let hub: RoomHub
  beforeEach(() => {
    hub = new RoomHub('ABCD')
    hub.addMember(hiderPlayer) // isHost: true
    hub.addMember(seekerPlayer) // isHost: false
  })

  it('starts in setup', () => {
    expect(hub.getPhase()).toBe('setup')
  })

  it('lets the host transition the phase', () => {
    expect(hub.applyHostAction('h1', 'start-seeking')).toBe('seeking')
    expect(hub.getPhase()).toBe('seeking')
  })

  it('ignores a non-host actor (conflict resolution)', () => {
    expect(hub.applyHostAction('s1', 'start-seeking')).toBeNull()
    expect(hub.getPhase()).toBe('setup')
  })

  it('ignores an unknown action', () => {
    expect(hub.applyHostAction('h1', 'nonsense')).toBeNull()
    expect(hub.getPhase()).toBe('setup')
  })

  it('maps start-hiding and end-round', () => {
    expect(hub.applyHostAction('h1', 'start-hiding')).toBe('hiding-period')
    expect(hub.applyHostAction('h1', 'end-round')).toBe('round-complete')
  })
})

describe('RoomHub ruled-out cells (set union)', () => {
  let hub: RoomHub
  beforeEach(() => {
    hub = new RoomHub('ABCD')
  })

  it('unions added cells with no duplicates', () => {
    hub.addRuledOutCells(['a', 'b'])
    hub.addRuledOutCells(['b', 'c'])
    expect(hub.ruledOutCells().sort()).toEqual(['a', 'b', 'c'])
  })
})
