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
    gameStore.currentPhase === GamePhase.Seeking ||
    gameStore.currentPhase === GamePhase.EndGame
  )
})

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
    if (newPhase === GamePhase.RoundComplete && (oldPhase === GamePhase.EndGame || oldPhase === GamePhase.Seeking)) {
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
    class="flex flex-col items-center gap-4 rounded-lg bg-slate-800 p-4"
    :class="timerClasses"
    :aria-label="ariaLabel"
    role="timer"
  >
    <!-- Timer Display -->
    <div
      data-testid="timer-display"
      class="font-mono text-4xl font-bold"
      :class="{
        'text-white': !isStopped,
        'text-green-400': isStopped,
      }"
    >
      {{ displayTime }}
    </div>

    <!-- Status Messages -->
    <div class="text-center">
      <p v-if="isStopped" class="text-lg font-semibold text-green-400">
        Hider found!
      </p>
      <p v-else-if="isEndGame" class="text-sm text-yellow-400">
        In hiding zone - searching for hider
      </p>
      <p v-else-if="isSeeking" class="text-sm text-slate-400">
        Seeking in progress
      </p>

      <!-- Paused Indicator -->
      <p v-if="timer.isPaused.value && !isStopped" class="text-sm text-yellow-400">
        Timer paused
      </p>
    </div>

    <!-- Control Buttons -->
    <div v-if="showControls" class="flex gap-2">
      <button
        v-if="!timer.isPaused.value"
        class="min-h-11 min-w-11 rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-600"
        aria-label="Pause timer"
        @click="pause"
      >
        Pause
      </button>
      <button
        v-else
        class="min-h-11 min-w-11 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-500"
        aria-label="Resume timer"
        @click="resume"
      >
        Resume
      </button>
    </div>
  </div>
</template>

<style scoped>
.paused {
  opacity: 0.8;
}

.stopped {
  border: 2px solid rgba(74, 222, 128, 0.5);
  background-color: rgba(22, 101, 52, 0.3);
}
</style>
