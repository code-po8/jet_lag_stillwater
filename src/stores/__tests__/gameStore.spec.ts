import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useGameStore, GamePhase, type Player } from '../gameStore'

describe('gameStore core', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with setup phase', () => {
      const store = useGameStore()

      expect(store.currentPhase).toBe(GamePhase.Setup)
    })

    it('should initialize with no current hider', () => {
      const store = useGameStore()

      expect(store.currentHiderId).toBeNull()
    })

    it('should initialize at round 0', () => {
      const store = useGameStore()

      expect(store.roundNumber).toBe(0)
    })

    it('should initialize with empty player list', () => {
      const store = useGameStore()

      expect(store.players).toEqual([])
    })
  })

  describe('player management', () => {
    it('should add players', () => {
      const store = useGameStore()

      store.addPlayer('Alice')
      store.addPlayer('Bob')

      expect(store.players.length).toBe(2)
      expect(store.players[0]?.name).toBe('Alice')
      expect(store.players[1]?.name).toBe('Bob')
    })

    it('should assign unique IDs to players', () => {
      const store = useGameStore()

      store.addPlayer('Alice')
      store.addPlayer('Bob')

      expect(store.players[0]?.id).toBeDefined()
      expect(store.players[1]?.id).toBeDefined()
      expect(store.players[0]?.id).not.toBe(store.players[1]?.id)
    })

    it('should remove players by ID', () => {
      const store = useGameStore()

      store.addPlayer('Alice')
      store.addPlayer('Bob')
      const aliceId = store.players[0]!.id

      store.removePlayer(aliceId)

      expect(store.players.length).toBe(1)
      expect(store.players[0]?.name).toBe('Bob')
    })

    it('should get player by ID', () => {
      const store = useGameStore()

      store.addPlayer('Alice')
      const aliceId = store.players[0]!.id

      const player = store.getPlayerById(aliceId)

      expect(player?.name).toBe('Alice')
    })

    it('should return undefined for non-existent player ID', () => {
      const store = useGameStore()

      const player = store.getPlayerById('non-existent')

      expect(player).toBeUndefined()
    })
  })

  describe('currentHider getter', () => {
    it('should return null when no hider is set', () => {
      const store = useGameStore()

      expect(store.currentHider).toBeNull()
    })

    it('should return the current hider player object', () => {
      const store = useGameStore()

      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.currentHiderId = store.players[0]!.id

      expect(store.currentHider?.name).toBe('Alice')
    })
  })

  describe('seekers getter', () => {
    it('should return empty array when no players', () => {
      const store = useGameStore()

      expect(store.seekers).toEqual([])
    })

    it('should return all players except current hider', () => {
      const store = useGameStore()

      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.addPlayer('Charlie')
      store.currentHiderId = store.players[0]!.id

      expect(store.seekers.length).toBe(2)
      expect(store.seekers.map((p) => p.name)).toEqual(['Bob', 'Charlie'])
    })
  })
})

describe('gameStore phase transitions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('startRound', () => {
    it('should transition from setup to hiding-period', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      const aliceId = store.players[0]!.id

      const result = store.startRound(aliceId)

      expect(result.success).toBe(true)
      expect(store.currentPhase).toBe(GamePhase.HidingPeriod)
    })

    it('should set the current hider', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      const aliceId = store.players[0]!.id

      store.startRound(aliceId)

      expect(store.currentHiderId).toBe(aliceId)
      expect(store.currentHider?.name).toBe('Alice')
    })

    it('should increment round number', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      store.startRound(store.players[0]!.id)

      expect(store.roundNumber).toBe(1)
    })

    it('should require at least 2 players', () => {
      const store = useGameStore()
      store.addPlayer('Alice')

      const result = store.startRound(store.players[0]!.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('At least 2 players required')
    })

    it('should reject invalid player ID as hider', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      const result = store.startRound('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid player ID')
    })

    it('should mark player as having been hider', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      const aliceId = store.players[0]!.id

      store.startRound(aliceId)

      expect(store.players[0]?.hasBeenHider).toBe(true)
    })
  })

  describe('startSeeking', () => {
    it('should transition from hiding-period to seeking', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)

      const result = store.startSeeking()

      expect(result.success).toBe(true)
      expect(store.currentPhase).toBe(GamePhase.Seeking)
    })

    it('should fail if not in hiding-period phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      // Still in setup phase

      const result = store.startSeeking()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot start seeking from current phase')
    })
  })

  describe('enterHidingZone', () => {
    it('should transition from seeking to end-game', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()

      const result = store.enterHidingZone()

      expect(result.success).toBe(true)
      expect(store.currentPhase).toBe(GamePhase.EndGame)
    })

    it('should fail if not in seeking phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      // Still in hiding-period phase

      const result = store.enterHidingZone()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot enter hiding zone from current phase')
    })
  })

  describe('hiderFound', () => {
    it('should transition from end-game to round-complete', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()

      const result = store.hiderFound()

      expect(result.success).toBe(true)
      expect(store.currentPhase).toBe(GamePhase.RoundComplete)
    })

    it('should fail if not in end-game phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      // Still in seeking phase

      const result = store.hiderFound()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot mark hider found from current phase')
    })
  })

  describe('endRound', () => {
    it('should record hider time', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()

      const hidingTimeMs = 3600000 // 1 hour
      const result = store.endRound(hidingTimeMs)

      expect(result.success).toBe(true)
      expect(store.players[0]?.totalHidingTimeMs).toBe(hidingTimeMs)
    })

    it('should transition back to setup for next round', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()

      store.endRound(3600000)

      expect(store.currentPhase).toBe(GamePhase.Setup)
      expect(store.currentHiderId).toBeNull()
    })

    it('should fail if not in round-complete phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      // Still in seeking phase

      const result = store.endRound(3600000)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot end round from current phase')
    })

    it('should accumulate hiding time across multiple rounds', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      // First round: Alice hides for 1 hour
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(3600000)

      // Second round: Alice hides again for 30 minutes
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(1800000)

      expect(store.players[0]?.totalHidingTimeMs).toBe(5400000) // 1.5 hours
    })
  })
})

describe('gameStore getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('allPlayersHaveBeenHider', () => {
    it('should return false when not all players have been hider', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(3600000)

      expect(store.allPlayersHaveBeenHider).toBe(false)
    })

    it('should return true when all players have been hider', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      // Alice hides
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(3600000)

      // Bob hides
      store.startRound(store.players[1]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(3600000)

      expect(store.allPlayersHaveBeenHider).toBe(true)
    })
  })

  describe('playersRankedByTime', () => {
    it('should rank players by total hiding time descending', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.addPlayer('Charlie')

      // Alice: 1 hour
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(3600000)

      // Bob: 2 hours
      store.startRound(store.players[1]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(7200000)

      // Charlie: 30 minutes
      store.startRound(store.players[2]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(1800000)

      const ranked = store.playersRankedByTime
      expect(ranked[0]?.name).toBe('Bob')
      expect(ranked[1]?.name).toBe('Alice')
      expect(ranked[2]?.name).toBe('Charlie')
    })
  })

  describe('playersWhoHaventBeenHider', () => {
    it('should return players who havent been hider yet', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.addPlayer('Charlie')

      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.enterHidingZone()
      store.hiderFound()
      store.endRound(3600000)

      const remaining = store.playersWhoHaventBeenHider
      expect(remaining.length).toBe(2)
      expect(remaining.map((p) => p.name)).toEqual(['Bob', 'Charlie'])
    })
  })
})

describe('gameStore persistence', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    })

    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should persist state to localStorage', async () => {
    const store = useGameStore()

    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)

    // Wait for Vue's watcher to trigger
    await nextTick()

    expect(localStorage.setItem).toHaveBeenCalled()

    const persistedKey = Object.keys(mockStorage).find((key) => key.includes('game'))
    expect(persistedKey).toBeDefined()
  })

  it('should rehydrate state on load', () => {
    const persistedState = {
      currentPhase: GamePhase.Seeking,
      currentHiderId: 'player-1',
      roundNumber: 2,
      players: [
        { id: 'player-1', name: 'Alice', hasBeenHider: true, totalHidingTimeMs: 3600000 },
        { id: 'player-2', name: 'Bob', hasBeenHider: false, totalHidingTimeMs: 0 },
      ],
    }

    mockStorage['jet-lag-stillwater:game'] = JSON.stringify(persistedState)

    const store = useGameStore()
    store.rehydrate()

    expect(store.currentPhase).toBe(GamePhase.Seeking)
    expect(store.currentHiderId).toBe('player-1')
    expect(store.roundNumber).toBe(2)
    expect(store.players.length).toBe(2)
  })

  it('should handle empty localStorage gracefully', () => {
    const store = useGameStore()
    store.rehydrate()

    expect(store.currentPhase).toBe(GamePhase.Setup)
    expect(store.players).toEqual([])
  })

  it('should handle corrupted localStorage data gracefully', () => {
    mockStorage['jet-lag-stillwater:game'] = 'not valid json {'

    const store = useGameStore()

    expect(() => store.rehydrate()).not.toThrow()
    expect(store.currentPhase).toBe(GamePhase.Setup)
  })
})
