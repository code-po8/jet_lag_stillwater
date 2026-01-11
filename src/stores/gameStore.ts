/**
 * Game Store
 *
 * Pinia store for tracking overall game state.
 * Tracks the current phase, players, current hider, and round progression.
 * Persists state to localStorage via the persistence service.
 */

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { createPersistenceService } from '@/services/persistence'

const STORAGE_KEY = 'game'

/**
 * Game phases representing the flow of a round
 */
export enum GamePhase {
  Setup = 'setup',
  HidingPeriod = 'hiding-period',
  Seeking = 'seeking',
  EndGame = 'end-game',
  RoundComplete = 'round-complete',
}

/**
 * Player data
 */
export interface Player {
  id: string
  name: string
  hasBeenHider: boolean
  totalHidingTimeMs: number
}

/**
 * Result type for game actions
 */
export interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Persisted state shape for localStorage
 */
interface PersistedGameState {
  currentPhase: GamePhase
  currentHiderId: string | null
  roundNumber: number
  players: Player[]
  isGamePaused: boolean
  pausedAt: number | null
  isHiderMoving: boolean
  moveStartedAt: number | null
}

/**
 * Generate a unique player ID
 */
function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useGameStore = defineStore('game', () => {
  // Persistence service
  const persistenceService = createPersistenceService()

  // State
  const currentPhase = ref<GamePhase>(GamePhase.Setup)
  const currentHiderId = ref<string | null>(null)
  const roundNumber = ref(0)
  const players = ref<Player[]>([])
  const isGamePaused = ref(false)
  const pausedAt = ref<number | null>(null)
  const isHiderMoving = ref(false)
  const moveStartedAt = ref<number | null>(null)

  // Getters
  const currentHider = computed<Player | null>(() => {
    if (!currentHiderId.value) return null
    return players.value.find((p) => p.id === currentHiderId.value) ?? null
  })

  const seekers = computed<Player[]>(() => {
    if (!currentHiderId.value) return []
    return players.value.filter((p) => p.id !== currentHiderId.value)
  })

  const allPlayersHaveBeenHider = computed<boolean>(() => {
    if (players.value.length === 0) return false
    return players.value.every((p) => p.hasBeenHider)
  })

  const playersRankedByTime = computed<Player[]>(() => {
    return [...players.value].sort((a, b) => b.totalHidingTimeMs - a.totalHidingTimeMs)
  })

  const playersWhoHaventBeenHider = computed<Player[]>(() => {
    return players.value.filter((p) => !p.hasBeenHider)
  })

  /**
   * Check if the game can be paused in the current phase.
   * Only active gameplay phases (hiding-period, seeking, end-game) allow pausing.
   */
  const canPauseGame = computed<boolean>(() => {
    const pauseablePhases = [
      GamePhase.HidingPeriod,
      GamePhase.Seeking,
      GamePhase.EndGame,
    ]
    return pauseablePhases.includes(currentPhase.value)
  })

  /**
   * Check if the hider can start a move in the current phase.
   * Move can only be played during hiding-period or seeking phases (not end-game or later).
   * Also cannot start a move if already moving.
   */
  const canStartMove = computed<boolean>(() => {
    if (isHiderMoving.value) return false
    const moveablePhases = [
      GamePhase.HidingPeriod,
      GamePhase.Seeking,
    ]
    return moveablePhases.includes(currentPhase.value)
  })

  /**
   * Persist current state to localStorage
   */
  function persist(): void {
    const state: PersistedGameState = {
      currentPhase: currentPhase.value,
      currentHiderId: currentHiderId.value,
      roundNumber: roundNumber.value,
      players: players.value,
      isGamePaused: isGamePaused.value,
      pausedAt: pausedAt.value,
      isHiderMoving: isHiderMoving.value,
      moveStartedAt: moveStartedAt.value,
    }
    persistenceService.save(STORAGE_KEY, state)
  }

  /**
   * Rehydrate state from localStorage.
   * Call this when the app loads to restore previous state.
   */
  function rehydrate(): void {
    try {
      const persisted = persistenceService.load<PersistedGameState>(STORAGE_KEY)
      if (persisted) {
        currentPhase.value = persisted.currentPhase
        currentHiderId.value = persisted.currentHiderId
        roundNumber.value = persisted.roundNumber
        players.value = persisted.players
        isGamePaused.value = persisted.isGamePaused ?? false
        pausedAt.value = persisted.pausedAt ?? null
        isHiderMoving.value = persisted.isHiderMoving ?? false
        moveStartedAt.value = persisted.moveStartedAt ?? null
      }
    } catch {
      // If rehydration fails (e.g., corrupted data), keep default state
      // No action needed - defaults are already set
    }
  }

  // Watch for state changes and persist automatically
  watch(
    [currentPhase, currentHiderId, roundNumber, players, isGamePaused, pausedAt, isHiderMoving, moveStartedAt],
    () => {
      persist()
    },
    { deep: true },
  )

  /**
   * Add a player to the game
   */
  function addPlayer(name: string): Player {
    const player: Player = {
      id: generatePlayerId(),
      name,
      hasBeenHider: false,
      totalHidingTimeMs: 0,
    }
    players.value.push(player)
    return player
  }

  /**
   * Remove a player from the game
   */
  function removePlayer(playerId: string): void {
    const index = players.value.findIndex((p) => p.id === playerId)
    if (index !== -1) {
      players.value.splice(index, 1)
    }
  }

  /**
   * Get a player by their ID
   */
  function getPlayerById(playerId: string): Player | undefined {
    return players.value.find((p) => p.id === playerId)
  }

  /**
   * Start a new round with the specified player as hider.
   * Transitions from setup to hiding-period.
   */
  function startRound(hiderId: string): ActionResult {
    // Validate player count
    if (players.value.length < 2) {
      return { success: false, error: 'At least 2 players required' }
    }

    // Validate hider exists
    const hider = getPlayerById(hiderId)
    if (!hider) {
      return { success: false, error: 'Invalid player ID' }
    }

    // Mark player as having been hider
    hider.hasBeenHider = true

    // Update state
    currentHiderId.value = hiderId
    currentPhase.value = GamePhase.HidingPeriod
    roundNumber.value += 1

    return { success: true }
  }

  /**
   * Start the seeking phase.
   * Transitions from hiding-period to seeking.
   */
  function startSeeking(): ActionResult {
    if (currentPhase.value !== GamePhase.HidingPeriod) {
      return { success: false, error: 'Cannot start seeking from current phase' }
    }

    currentPhase.value = GamePhase.Seeking
    return { success: true }
  }

  /**
   * Enter the hiding zone (seekers found the general area).
   * Transitions from seeking to end-game.
   */
  function enterHidingZone(): ActionResult {
    if (currentPhase.value !== GamePhase.Seeking) {
      return { success: false, error: 'Cannot enter hiding zone from current phase' }
    }

    currentPhase.value = GamePhase.EndGame
    return { success: true }
  }

  /**
   * Mark the hider as found.
   * Transitions from end-game to round-complete.
   * Clears any active pause state and move state.
   */
  function hiderFound(): ActionResult {
    if (currentPhase.value !== GamePhase.EndGame) {
      return { success: false, error: 'Cannot mark hider found from current phase' }
    }

    // Clear pause state when transitioning to round-complete
    isGamePaused.value = false
    pausedAt.value = null

    // Clear move state when transitioning to round-complete
    isHiderMoving.value = false
    moveStartedAt.value = null

    currentPhase.value = GamePhase.RoundComplete
    return { success: true }
  }

  /**
   * End the current round and record the hiding time.
   * Transitions from round-complete back to setup.
   */
  function endRound(hidingTimeMs: number): ActionResult {
    if (currentPhase.value !== GamePhase.RoundComplete) {
      return { success: false, error: 'Cannot end round from current phase' }
    }

    // Record the hiding time for the current hider
    const hider = currentHider.value
    if (hider) {
      hider.totalHidingTimeMs += hidingTimeMs
    }

    // Reset for next round
    currentPhase.value = GamePhase.Setup
    currentHiderId.value = null

    return { success: true }
  }

  /**
   * Reset the entire game to initial state.
   * Clears all players, resets phase and round number.
   */
  function resetGame(): void {
    currentPhase.value = GamePhase.Setup
    currentHiderId.value = null
    roundNumber.value = 0
    players.value = []
    isGamePaused.value = false
    pausedAt.value = null
    isHiderMoving.value = false
    moveStartedAt.value = null
  }

  /**
   * Start a move action (hider is relocating to a new hiding zone).
   * Pauses the hiding timer and notifies seekers to stay put.
   */
  function startMove(): ActionResult {
    if (!canStartMove.value) {
      if (isHiderMoving.value) {
        return { success: false, error: 'Hider is already moving' }
      }
      return { success: false, error: 'Cannot start move in current phase' }
    }

    isHiderMoving.value = true
    moveStartedAt.value = Date.now()
    return { success: true }
  }

  /**
   * Confirm the new hiding zone after a move.
   * Resumes the hiding timer.
   */
  function confirmNewZone(): ActionResult {
    if (!isHiderMoving.value) {
      return { success: false, error: 'Hider is not currently moving' }
    }

    isHiderMoving.value = false
    moveStartedAt.value = null
    return { success: true }
  }

  /**
   * Pause the game.
   * Stops all timers and shows pause overlay.
   */
  function pauseGame(): ActionResult {
    if (!canPauseGame.value) {
      return { success: false, error: 'Cannot pause game in current phase' }
    }

    if (isGamePaused.value) {
      return { success: false, error: 'Game is already paused' }
    }

    isGamePaused.value = true
    pausedAt.value = Date.now()
    return { success: true }
  }

  /**
   * Resume the game.
   * Restarts all timers from where they were paused.
   */
  function resumeGame(): ActionResult {
    if (!isGamePaused.value) {
      return { success: false, error: 'Game is not paused' }
    }

    isGamePaused.value = false
    pausedAt.value = null
    return { success: true }
  }

  return {
    // State
    currentPhase,
    currentHiderId,
    roundNumber,
    players,
    isGamePaused,
    pausedAt,
    isHiderMoving,
    moveStartedAt,
    // Getters
    currentHider,
    seekers,
    allPlayersHaveBeenHider,
    playersRankedByTime,
    playersWhoHaventBeenHider,
    canPauseGame,
    canStartMove,
    // Actions
    addPlayer,
    removePlayer,
    getPlayerById,
    startRound,
    startSeeking,
    enterHidingZone,
    hiderFound,
    endRound,
    resetGame,
    pauseGame,
    resumeGame,
    startMove,
    confirmNewZone,
    // Persistence
    rehydrate,
  }
})
