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
   * Persist current state to localStorage
   */
  function persist(): void {
    const state: PersistedGameState = {
      currentPhase: currentPhase.value,
      currentHiderId: currentHiderId.value,
      roundNumber: roundNumber.value,
      players: players.value,
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
      }
    } catch {
      // If rehydration fails (e.g., corrupted data), keep default state
      // No action needed - defaults are already set
    }
  }

  // Watch for state changes and persist automatically
  watch(
    [currentPhase, currentHiderId, roundNumber, players],
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
   */
  function hiderFound(): ActionResult {
    if (currentPhase.value !== GamePhase.EndGame) {
      return { success: false, error: 'Cannot mark hider found from current phase' }
    }

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
  }

  return {
    // State
    currentPhase,
    currentHiderId,
    roundNumber,
    players,
    // Getters
    currentHider,
    seekers,
    allPlayersHaveBeenHider,
    playersRankedByTime,
    playersWhoHaventBeenHider,
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
    // Persistence
    rehydrate,
  }
})
