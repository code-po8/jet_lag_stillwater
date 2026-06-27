<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useTimer } from '@/composables/useTimer'
import { formatTime } from '@/utils/formatTime'
import { createPersistenceService } from '@/services/persistence'

const STORAGE_KEY = 'hiding-duration-timer'

const emit = defineEmits<{
  finalTime: [timeMs: number]
}>()

const gameStore = useGameStore()
const persistenceService = createPersistenceService()

// Track if timer has been stopped (hider found)
const isStopped = ref(false)
const finalTimeMs = ref<number | null>(null)

// Initialize timer in count-up mode (not countdown)
const timer = useTimer({
  countdown: false,
  tickInterval: 100,
  onTick: handleTick,
})

// Computed values for phase awareness
const isActivePhase = computed(() => {
  return (
    gameStore.currentPhase === GamePhase.Seeking || gameStore.currentPhase === GamePhase.EndGame
  )
})

const isGamePaused = computed(() => gameStore.isGamePaused)

const isVisiblePhase = computed(() => {
  return (
    gameStore.currentPhase === GamePhase.Seeking ||
    gameStore.currentPhase === GamePhase.EndGame ||
    gameStore.currentPhase === GamePhase.RoundComplete
  )
})

const isEndGame = computed(() => {
  return gameStore.currentPhase === GamePhase.EndGame
})

const isSeeking = computed(() => {
  return gameStore.currentPhase === GamePhase.Seeking
})

// Display time - show final time if stopped, otherwise current elapsed
const displayTime = computed(() => {
  const timeMs = finalTimeMs.value !== null ? finalTimeMs.value : timer.elapsed.value
  return formatTime(timeMs)
})

// Show controls only when timer is actively running
const showControls = computed(() => {
  return isActivePhase.value && !isStopped.value
})

const timerClasses = computed(() => ({
  paused: timer.isPaused.value && !isStopped.value,
  stopped: isStopped.value,
}))

const ariaLabel = computed(() => {
  if (isStopped.value) {
    return `Hiding duration timer stopped at ${displayTime.value}`
  }
  if (timer.isPaused.value) {
    return `Hiding duration timer paused at ${displayTime.value}`
  }
  return `Hiding duration timer: ${displayTime.value} elapsed`
})

/**
 * Handle timer tick - persist state
 */
function handleTick() {
  persist()
}

/**
 * Pause the timer
 */
function pause() {
  timer.pause()
  persist()
}

/**
 * Resume the timer
 */
function resume() {
  timer.resume()
  persist()
}

/**
 * Stop the timer and record final time
 */
function stop() {
  if (isStopped.value) return

  isStopped.value = true
  finalTimeMs.value = timer.elapsed.value
  timer.pause() // Stop tracking but don't reset

  emit('finalTime', finalTimeMs.value)
  persist()
}

/**
 * Persist timer state to localStorage
 */
function persist() {
  const state = {
    elapsed: timer.elapsed.value,
    isRunning: timer.isRunning.value,
    isPaused: timer.isPaused.value,
    isStopped: isStopped.value,
    finalTimeMs: finalTimeMs.value,
    startTime: Date.now(),
  }
  persistenceService.save(STORAGE_KEY, state)
}

// Flag to prevent watch from overwriting rehydrated state
const isRehydrating = ref(false)

/**
 * Restore timer state from localStorage
 */
function rehydrate(): boolean {
  try {
    const state = persistenceService.load<{
      elapsed: number
      isRunning: boolean
      isPaused: boolean
      isStopped: boolean
      finalTimeMs: number | null
      startTime: number
    }>(STORAGE_KEY)

    if (state && isVisiblePhase.value) {
      isRehydrating.value = true
      isStopped.value = state.isStopped
      finalTimeMs.value = state.finalTimeMs

      if (state.isStopped) {
        // Timer was stopped - just restore the final time
        timer.elapsed.value = state.finalTimeMs ?? state.elapsed
      } else if (state.isRunning && !state.isPaused) {
        // Timer was running - calculate time passed while app was closed
        const timePassed = Date.now() - state.startTime
        const totalElapsed = state.elapsed + timePassed

        timer.elapsed.value = totalElapsed
        if (isActivePhase.value) {
          timer.start()
        }
      } else if (state.isPaused) {
        // Timer was paused - restore that state
        timer.elapsed.value = state.elapsed
        if (isActivePhase.value) {
          timer.start()
          timer.pause()
        }
      }

      isRehydrating.value = false
      return true
    }
  } catch {
    // If rehydration fails, start fresh
  }
  return false
}

// Watch for phase changes to start/stop timer
watch(
  () => gameStore.currentPhase,
  (newPhase, oldPhase) => {
    if (isRehydrating.value) return

    // Start timer when entering seeking phase (from any previous phase)
    if (newPhase === GamePhase.Seeking && !timer.isRunning.value && !isStopped.value) {
      isStopped.value = false
      finalTimeMs.value = null
      timer.reset()
      timer.start()
      persist()
    }

    // Stop timer when hider is found (entering round-complete)
    if (
      newPhase === GamePhase.RoundComplete &&
      (oldPhase === GamePhase.EndGame || oldPhase === GamePhase.Seeking)
    ) {
      stop()
    }

    // Reset when returning to setup
    if (newPhase === GamePhase.Setup) {
      timer.reset()
      isStopped.value = false
      finalTimeMs.value = null
      persistenceService.remove(STORAGE_KEY)
    }
  },
  { immediate: false },
)

// Watch for game-level pause/resume
watch(isGamePaused, (paused) => {
  if (!isActivePhase.value || isStopped.value) return

  if (paused && timer.isRunning.value && !timer.isPaused.value) {
    timer.pause()
    persist()
  } else if (!paused && timer.isRunning.value && timer.isPaused.value) {
    timer.resume()
    persist()
  }
})

// Handle visibility change for app backgrounding
function handleVisibilityChange() {
  if (document.hidden) {
    // App going to background - persist current state
    persist()
  } else {
    // App coming back - handle time drift
    if (!isStopped.value && timer.isRunning.value && !timer.isPaused.value) {
      timer.handleVisibilityChange(true)
    }
  }
}

onMounted(() => {
  // Try to rehydrate first; if no persisted state, start fresh if in active phase
  const wasRehydrated = rehydrate()
  if (!wasRehydrated && isActivePhase.value && !timer.isRunning.value && !isStopped.value) {
    timer.start()
    persist()
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  persist()
})
</script>

<template>
  <div
    v-if="isVisiblePhase"
    data-testid="hiding-duration-timer"
    class="timer-container"
    :class="timerClasses"
    :aria-label="ariaLabel"
    role="timer"
  >
    <!-- Timer Header -->
    <div class="timer-header">
      <svg class="timer-icon" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        />
      </svg>
      <span class="timer-label">HIDING TIME</span>
    </div>

    <!-- Timer Display -->
    <div
      data-testid="timer-display"
      class="timer-display"
      :class="{
        'timer-running': !isStopped,
        'timer-found': isStopped,
      }"
    >
      {{ displayTime }}
    </div>

    <!-- Status Messages -->
    <div class="timer-status">
      <p v-if="isStopped" class="timer-status-found">
        <svg class="timer-status-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        Hider found!
      </p>
      <p v-else-if="isEndGame" class="timer-status-endgame">
        <svg class="timer-status-icon-small" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        </svg>
        In hiding zone - searching for hider
      </p>
      <p v-else-if="isSeeking" class="timer-status-seeking">Seeking in progress</p>

      <!-- Paused Indicator -->
      <p v-if="timer.isPaused.value && !isStopped" class="timer-status-paused">
        <svg class="timer-status-icon-small" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
        Timer paused
      </p>
    </div>

    <!-- Control Buttons -->
    <div v-if="showControls" class="timer-controls">
      <button
        v-if="!timer.isPaused.value"
        class="btn-show btn-show-secondary"
        aria-label="Pause timer"
        @click="pause"
      >
        <svg class="timer-btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
        Pause
      </button>
      <button v-else class="btn-show btn-show-success" aria-label="Resume timer" @click="resume">
        <svg class="timer-btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Resume
      </button>
    </div>
  </div>
</template>

<style scoped>
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.timer-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-brand-cyan);
}

.timer-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.15em;
  color: var(--color-ui-text-secondary);
}

.timer-display {
  font-family: var(--font-display);
  font-size: 3.5rem;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.timer-running {
  color: white;
}

.timer-found {
  color: var(--color-status-success);
}

.timer-status {
  text-align: center;
}

.timer-status-found {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  color: var(--color-status-success);
}

.timer-status-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.timer-status-endgame {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-status-warning);
}

.timer-status-seeking {
  font-size: 0.875rem;
  color: var(--color-ui-text-muted);
}

.timer-status-paused {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-status-warning);
  margin-top: 0.5rem;
}

.timer-status-icon-small {
  width: 1rem;
  height: 1rem;
}

.timer-controls {
  display: flex;
  gap: 0.75rem;
}

.timer-btn-icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* State modifiers */
.paused {
  opacity: 0.85;
}

.stopped {
  border-color: rgba(34, 197, 94, 0.4);
  background: linear-gradient(135deg, rgba(22, 101, 52, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%);
}
</style>
