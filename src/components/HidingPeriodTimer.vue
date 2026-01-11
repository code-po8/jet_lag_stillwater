<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useTimer } from '@/composables/useTimer'
import { useNotifications } from '@/composables/useNotifications'
import { formatTimeShort } from '@/utils/formatTime'
import { createPersistenceService } from '@/services/persistence'

const HIDING_PERIOD_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const STORAGE_KEY = 'hiding-period-timer'

interface Props {
  role?: 'hider' | 'seeker'
}

const props = withDefaults(defineProps<Props>(), {
  role: 'hider',
})

const emit = defineEmits<{
  warning: []
  complete: []
}>()

const gameStore = useGameStore()
const persistenceService = createPersistenceService()
const notifications = useNotifications()

// Timer state
const hasWarned = ref(false)
const hasCompleted = ref(false)

// Initialize timer with countdown mode
const timer = useTimer({
  countdown: true,
  initialTime: HIDING_PERIOD_MS,
  tickInterval: 100,
  onTick: handleTick,
  onComplete: handleComplete,
})

// Computed values
const isHidingPeriod = computed(() => gameStore.currentPhase === GamePhase.HidingPeriod)
const isGamePaused = computed(() => gameStore.isGamePaused)

const displayTime = computed(() => {
  return formatTimeShort(timer.remaining.value)
})

const isWarning = computed(() => {
  return timer.remaining.value <= WARNING_THRESHOLD_MS && timer.remaining.value > 0
})

const isExpired = computed(() => {
  return timer.remaining.value <= 0 && hasCompleted.value
})

const timerClasses = computed(() => ({
  warning: isWarning.value && !isExpired.value,
  expired: isExpired.value,
  paused: timer.isPaused.value,
}))

const ariaLabel = computed(() => {
  if (isExpired.value) {
    return 'Hiding period timer expired. Seeking begins.'
  }
  if (timer.isPaused.value) {
    return `Hiding period timer paused at ${displayTime.value}`
  }
  return `Hiding period timer: ${displayTime.value} remaining`
})

/**
 * Handle timer tick - check for warning threshold
 */
function handleTick() {
  if (!hasWarned.value && timer.remaining.value <= WARNING_THRESHOLD_MS) {
    hasWarned.value = true
    notifications.notifyTimerWarning()
    emit('warning')
  }
  persist()
}

/**
 * Handle timer completion
 */
function handleComplete() {
  hasCompleted.value = true
  notifications.notifyHidingPeriodEnded()
  emit('complete')
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
 * Persist timer state to localStorage
 */
function persist() {
  const state = {
    elapsed: timer.elapsed.value,
    isRunning: timer.isRunning.value,
    isPaused: timer.isPaused.value,
    hasWarned: hasWarned.value,
    hasCompleted: hasCompleted.value,
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
      hasWarned: boolean
      hasCompleted: boolean
      startTime: number
    }>(STORAGE_KEY)

    if (state && isHidingPeriod.value) {
      // If the persisted state shows timer wasn't running and wasn't paused,
      // it's stale data from a previous completed game - ignore it
      if (!state.isRunning && !state.isPaused) {
        persistenceService.remove(STORAGE_KEY)
        return false
      }

      isRehydrating.value = true
      hasWarned.value = state.hasWarned
      hasCompleted.value = state.hasCompleted

      if (state.isRunning && !state.isPaused) {
        // Calculate time that passed while app was closed
        const timePassed = Date.now() - state.startTime
        const totalElapsed = state.elapsed + timePassed

        // Manually set the elapsed time and start the timer
        // The timer will pick up from where it should be
        if (totalElapsed < HIDING_PERIOD_MS) {
          // Timer should still be running
          timer.elapsed.value = totalElapsed
          timer.start()
        } else {
          // Timer would have completed while app was closed
          // Clear stale state and start fresh for new game
          persistenceService.remove(STORAGE_KEY)
          isRehydrating.value = false
          return false
        }
      } else if (state.isPaused) {
        // Timer was paused - restore that state
        timer.elapsed.value = state.elapsed
        timer.start()
        timer.pause()
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
  isHidingPeriod,
  (active) => {
    if (isRehydrating.value) return

    if (active && !timer.isRunning.value && !hasCompleted.value) {
      timer.start()
      persist()
    } else if (!active) {
      timer.stop()
      hasWarned.value = false
      hasCompleted.value = false
      persistenceService.remove(STORAGE_KEY)
    }
  },
  { immediate: false }, // Don't run immediately - let rehydrate handle initial state
)

// Watch for game-level pause/resume
watch(
  isGamePaused,
  (paused) => {
    if (!isHidingPeriod.value || hasCompleted.value) return

    if (paused && timer.isRunning.value && !timer.isPaused.value) {
      timer.pause()
      persist()
    } else if (!paused && timer.isRunning.value && timer.isPaused.value) {
      timer.resume()
      persist()
    }
  },
)

// Handle visibility change for app backgrounding
function handleVisibilityChange() {
  if (document.hidden) {
    // App going to background - persist current state
    persist()
  } else {
    // App coming back - handle time drift
    timer.handleVisibilityChange(true)
  }
}

onMounted(() => {
  // Try to rehydrate first; if no persisted state, start fresh if in hiding period
  const wasRehydrated = rehydrate()
  if (!wasRehydrated && isHidingPeriod.value && !timer.isRunning.value) {
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
    v-if="isHidingPeriod || isExpired"
    data-testid="hiding-period-timer"
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
        'text-white': !isWarning && !isExpired,
        'text-yellow-400': isWarning && !isExpired,
        'text-red-400': isExpired,
      }"
    >
      {{ displayTime }}
    </div>

    <!-- Status Messages -->
    <div class="text-center">
      <!-- Seeking Begins Message -->
      <p v-if="isExpired" class="text-lg font-semibold text-red-400">Seeking begins!</p>

      <!-- Seeker Freeze Message -->
      <p
        v-else-if="props.role === 'seeker' && !isExpired"
        class="text-sm text-slate-400"
      >
        Seekers are frozen during hiding period
      </p>

      <!-- Paused Indicator -->
      <p v-if="timer.isPaused.value && !isExpired" class="text-sm text-yellow-400">
        Timer paused
      </p>
    </div>

    <!-- Control Buttons -->
    <div v-if="!isExpired" class="flex gap-2">
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
.warning {
  border: 2px solid rgba(234, 179, 8, 0.5);
  background-color: rgba(113, 63, 18, 0.3);
}

.expired {
  border: 2px solid rgba(239, 68, 68, 0.5);
  background-color: rgba(127, 29, 29, 0.3);
}

.paused {
  opacity: 0.8;
}
</style>
