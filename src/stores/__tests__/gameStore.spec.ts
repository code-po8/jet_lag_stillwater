import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useGameStore, GamePhase } from '../gameStore'

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

describe('gameStore resetGame action', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should reset phase to setup', () => {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)
    store.startSeeking()

    store.resetGame()

    expect(store.currentPhase).toBe(GamePhase.Setup)
  })

  it('should clear all players', () => {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')

    store.resetGame()

    expect(store.players).toEqual([])
  })

  it('should reset round number to 0', () => {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)
    store.startSeeking()
    store.enterHidingZone()
    store.hiderFound()
    store.endRound(3600000)

    store.resetGame()

    expect(store.roundNumber).toBe(0)
  })

  it('should clear current hider', () => {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)

    store.resetGame()

    expect(store.currentHiderId).toBeNull()
    expect(store.currentHider).toBeNull()
  })

  it('should clear localStorage persistence', async () => {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)
    await nextTick()

    store.resetGame()
    await nextTick()

    // After reset, the persisted state should be empty/default
    const store2 = useGameStore()
    store2.rehydrate()
    expect(store2.players).toEqual([])
    expect(store2.roundNumber).toBe(0)
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

describe('gameStore move powerup (CARD-007d)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function setupGameInSeeking() {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)
    store.startSeeking()
    return store
  }

  describe('isHiderMoving state', () => {
    it('should initialize with isHiderMoving as false', () => {
      const store = useGameStore()

      expect(store.isHiderMoving).toBe(false)
    })
  })

  describe('moveStartedAt state', () => {
    it('should initialize with moveStartedAt as null', () => {
      const store = useGameStore()

      expect(store.moveStartedAt).toBeNull()
    })
  })

  describe('canStartMove getter', () => {
    it('should return false during setup phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      expect(store.canStartMove).toBe(false)
    })

    it('should return true during hiding-period phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)

      expect(store.canStartMove).toBe(true)
    })

    it('should return true during seeking phase', () => {
      const store = setupGameInSeeking()

      expect(store.canStartMove).toBe(true)
    })

    it('should return false during end-game phase', () => {
      const store = setupGameInSeeking()
      store.enterHidingZone()

      expect(store.canStartMove).toBe(false)
    })

    it('should return false during round-complete phase', () => {
      const store = setupGameInSeeking()
      store.enterHidingZone()
      store.hiderFound()

      expect(store.canStartMove).toBe(false)
    })

    it('should return false if hider is already moving', () => {
      const store = setupGameInSeeking()
      store.startMove()

      expect(store.canStartMove).toBe(false)
    })
  })

  describe('startMove action', () => {
    it('should set isHiderMoving to true', () => {
      const store = setupGameInSeeking()

      const result = store.startMove()

      expect(result.success).toBe(true)
      expect(store.isHiderMoving).toBe(true)
    })

    it('should record move timestamp', () => {
      const now = Date.now()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      const store = setupGameInSeeking()
      store.startMove()

      expect(store.moveStartedAt).toBe(now)

      vi.useRealTimers()
    })

    it('should fail if not in a moveable phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      // Still in setup phase

      const result = store.startMove()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot start move in current phase')
    })

    it('should fail if hider is already moving', () => {
      const store = setupGameInSeeking()
      store.startMove()

      const result = store.startMove()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Hider is already moving')
    })

    it('should fail during end-game phase', () => {
      const store = setupGameInSeeking()
      store.enterHidingZone()

      const result = store.startMove()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot start move in current phase')
    })
  })

  describe('confirmNewZone action', () => {
    it('should set isHiderMoving to false', () => {
      const store = setupGameInSeeking()
      store.startMove()

      const result = store.confirmNewZone()

      expect(result.success).toBe(true)
      expect(store.isHiderMoving).toBe(false)
    })

    it('should clear move timestamp', () => {
      const store = setupGameInSeeking()
      store.startMove()

      store.confirmNewZone()

      expect(store.moveStartedAt).toBeNull()
    })

    it('should fail if hider is not moving', () => {
      const store = setupGameInSeeking()

      const result = store.confirmNewZone()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Hider is not currently moving')
    })
  })

  describe('move state persistence', () => {
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

    it('should persist move state to localStorage', async () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.startSeeking()
      store.startMove()

      await nextTick()

      const persistedData = JSON.parse(mockStorage['jet-lag-stillwater:game'] || '{}')
      expect(persistedData.isHiderMoving).toBe(true)
      expect(persistedData.moveStartedAt).toBeDefined()
    })

    it('should rehydrate move state from localStorage', () => {
      const now = Date.now()
      const persistedState = {
        currentPhase: GamePhase.Seeking,
        currentHiderId: 'player-1',
        roundNumber: 1,
        players: [
          { id: 'player-1', name: 'Alice', hasBeenHider: true, totalHidingTimeMs: 0 },
          { id: 'player-2', name: 'Bob', hasBeenHider: false, totalHidingTimeMs: 0 },
        ],
        isGamePaused: false,
        pausedAt: null,
        isHiderMoving: true,
        moveStartedAt: now,
      }

      mockStorage['jet-lag-stillwater:game'] = JSON.stringify(persistedState)

      const store = useGameStore()
      store.rehydrate()

      expect(store.isHiderMoving).toBe(true)
      expect(store.moveStartedAt).toBe(now)
    })
  })

  describe('move clears on phase transitions', () => {
    it('should clear move state when transitioning to round-complete', () => {
      const store = setupGameInSeeking()
      store.startMove()
      store.confirmNewZone()
      store.enterHidingZone()

      store.hiderFound()

      expect(store.isHiderMoving).toBe(false)
      expect(store.moveStartedAt).toBeNull()
    })

    it('should clear move state when game is reset', () => {
      const store = setupGameInSeeking()
      store.startMove()

      store.resetGame()

      expect(store.isHiderMoving).toBe(false)
      expect(store.moveStartedAt).toBeNull()
    })
  })
})

describe('gameStore pause/resume (GS-007)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function setupGameInProgress() {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)
    store.startSeeking()
    return store
  }

  describe('isGamePaused state', () => {
    it('should initialize with isGamePaused as false', () => {
      const store = useGameStore()

      expect(store.isGamePaused).toBe(false)
    })
  })

  describe('canPauseGame getter', () => {
    it('should return false during setup phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      expect(store.canPauseGame).toBe(false)
    })

    it('should return true during hiding-period phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)

      expect(store.canPauseGame).toBe(true)
    })

    it('should return true during seeking phase', () => {
      const store = setupGameInProgress()

      expect(store.canPauseGame).toBe(true)
    })

    it('should return true during end-game phase', () => {
      const store = setupGameInProgress()
      store.enterHidingZone()

      expect(store.canPauseGame).toBe(true)
    })

    it('should return false during round-complete phase', () => {
      const store = setupGameInProgress()
      store.enterHidingZone()
      store.hiderFound()

      expect(store.canPauseGame).toBe(false)
    })
  })

  describe('pauseGame action', () => {
    it('should set isGamePaused to true', () => {
      const store = setupGameInProgress()

      const result = store.pauseGame()

      expect(result.success).toBe(true)
      expect(store.isGamePaused).toBe(true)
    })

    it('should fail if game is already paused', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      const result = store.pauseGame()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Game is already paused')
    })

    it('should fail if not in a pauseable phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      // Still in setup phase

      const result = store.pauseGame()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot pause game in current phase')
    })

    it('should record pause timestamp', () => {
      const now = Date.now()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      const store = setupGameInProgress()
      store.pauseGame()

      expect(store.pausedAt).toBe(now)

      vi.useRealTimers()
    })
  })

  describe('resumeGame action', () => {
    it('should set isGamePaused to false', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      const result = store.resumeGame()

      expect(result.success).toBe(true)
      expect(store.isGamePaused).toBe(false)
    })

    it('should fail if game is not paused', () => {
      const store = setupGameInProgress()

      const result = store.resumeGame()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Game is not paused')
    })

    it('should clear pause timestamp on resume', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      store.resumeGame()

      expect(store.pausedAt).toBeNull()
    })
  })

  describe('pause state persistence', () => {
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

    it('should persist pause state to localStorage', async () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      store.pauseGame()

      await nextTick()

      const persistedData = JSON.parse(mockStorage['jet-lag-stillwater:game'] || '{}')
      expect(persistedData.isGamePaused).toBe(true)
    })

    it('should rehydrate pause state from localStorage', () => {
      const now = Date.now()
      const persistedState = {
        currentPhase: GamePhase.Seeking,
        currentHiderId: 'player-1',
        roundNumber: 1,
        players: [
          { id: 'player-1', name: 'Alice', hasBeenHider: true, totalHidingTimeMs: 0 },
          { id: 'player-2', name: 'Bob', hasBeenHider: false, totalHidingTimeMs: 0 },
        ],
        isGamePaused: true,
        pausedAt: now,
      }

      mockStorage['jet-lag-stillwater:game'] = JSON.stringify(persistedState)

      const store = useGameStore()
      store.rehydrate()

      expect(store.isGamePaused).toBe(true)
      expect(store.pausedAt).toBe(now)
    })
  })

  describe('pause clears on phase transitions', () => {
    it('should clear pause state when transitioning to round-complete', () => {
      const store = setupGameInProgress()
      store.enterHidingZone()
      store.pauseGame()

      store.hiderFound()

      expect(store.isGamePaused).toBe(false)
    })

    it('should clear pause state when game is reset', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      store.resetGame()

      expect(store.isGamePaused).toBe(false)
    })
  })
})
