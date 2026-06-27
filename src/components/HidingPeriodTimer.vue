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
watch(isGamePaused, (paused) => {
  if (!isHidingPeriod.value || hasCompleted.value) return

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
    class="timer-container"
    :class="timerClasses"
    :aria-label="ariaLabel"
    role="timer"
  >
    <!-- Timer Header -->
    <div class="timer-header">
      <svg class="timer-icon" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
        />
      </svg>
      <span class="timer-label">HIDING PERIOD</span>
    </div>

    <!-- Timer Display -->
    <div
      data-testid="timer-display"
      class="timer-display"
      :class="{
        'timer-normal': !isWarning && !isExpired,
        'timer-warning': isWarning && !isExpired,
        'timer-danger': isExpired,
      }"
    >
      {{ displayTime }}
    </div>

    <!-- Status Messages -->
    <div class="timer-status">
      <!-- Seeking Begins Message -->
      <p v-if="isExpired" class="timer-status-alert">
        <svg class="timer-status-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"
          />
        </svg>
        Seeking begins!
      </p>

      <!-- Seeker Freeze Message -->
      <p v-else-if="props.role === 'seeker' && !isExpired" class="timer-status-info">
        Seekers are frozen during hiding period
      </p>

      <!-- Paused Indicator -->
      <p v-if="timer.isPaused.value && !isExpired" class="timer-status-paused">
        <svg class="timer-status-icon-small" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
        Timer paused
      </p>
    </div>

    <!-- Control Buttons -->
    <div v-if="!isExpired" class="timer-controls">
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
  color: var(--color-brand-gold);
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

.timer-normal {
  color: white;
}

.timer-warning {
  color: var(--color-status-warning);
  animation: timer-pulse 1s ease-in-out infinite;
}

.timer-danger {
  color: var(--color-status-error);
  animation: timer-pulse 0.5s ease-in-out infinite;
}

@keyframes timer-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.timer-status {
  text-align: center;
}

.timer-status-alert {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  color: var(--color-status-error);
}

.timer-status-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.timer-status-info {
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
.warning {
  border-color: rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, rgba(180, 83, 9, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.expired {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.paused {
  opacity: 0.85;
}
</style>
