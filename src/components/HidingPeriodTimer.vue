<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync } from '@/composables/useSync'
import { useGameSync } from '@/composables/useGameSync'
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
const room = useRoomStore()
const sync = useSync()
const { hostAction } = useGameSync()
const persistenceService = createPersistenceService()
const notifications = useNotifications()

/**
 * In a multiplayer room the countdown is SERVER-authoritative: elapsed is
 * re-derived every tick from the shared phase-start instant (via the clock
 * offset) minus paused time, so every device agrees and self-corrects as the
 * clock offset refines. `roomElapsedMs` mirrors that value for the template;
 * offline, the local `useTimer` drives everything as before.
 */
const roomElapsedMs = ref(0)
let roomTick: ReturnType<typeof setInterval> | null = null

/** True when the server-synced timer should drive the display. */
const useRoomTimer = computed(() => room.inRoom && sync.phaseStartedAt.value !== null)

function pollRoomElapsed() {
  const e = sync.effectiveElapsedMs()
  if (e !== null) roomElapsedMs.value = e
}

function startRoomTick() {
  pollRoomElapsed()
  if (roomTick) clearInterval(roomTick)
  roomTick = setInterval(pollRoomElapsed, 200)
}

function stopRoomTick() {
  if (roomTick) {
    clearInterval(roomTick)
    roomTick = null
  }
}

/** In a room, elapsed to seed the local timer from the shared server instant. */
function serverElapsedMs(): number | null {
  return useRoomTimer.value ? sync.effectiveElapsedMs() : null
}

/**
 * Start the timer. In a room the display reads `roomElapsedMs` (server-driven),
 * so we spin up the room tick; the local `useTimer` is still started/seeded so
 * offline fallback and completion bookkeeping keep working.
 */
function startAligned() {
  timer.start(serverElapsedMs() ?? 0)
  if (room.inRoom) startRoomTick()
}

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

/**
 * The authoritative remaining ms: server-derived in a room, local otherwise.
 * All display/threshold logic reads THIS so both sources stay consistent.
 */
const activeRemaining = computed(() => {
  if (useRoomTimer.value) return Math.max(0, HIDING_PERIOD_MS - roomElapsedMs.value)
  return timer.remaining.value
})

const displayTime = computed(() => {
  return formatTimeShort(activeRemaining.value)
})

const isWarning = computed(() => {
  return activeRemaining.value <= WARNING_THRESHOLD_MS && activeRemaining.value > 0
})

const isExpired = computed(() => {
  return activeRemaining.value <= 0 && hasCompleted.value
})

/** Paused for display: server-synced pause in a room, local timer otherwise. */
const isPausedDisplay = computed(() =>
  useRoomTimer.value ? gameStore.isGamePaused : timer.isPaused.value,
)

const timerClasses = computed(() => ({
  warning: isWarning.value && !isExpired.value,
  expired: isExpired.value,
  paused: isPausedDisplay.value,
}))

const ariaLabel = computed(() => {
  if (isExpired.value) {
    return 'Hiding period timer expired. Seeking begins.'
  }
  if (isPausedDisplay.value) {
    return `Hiding period timer paused at ${displayTime.value}`
  }
  return `Hiding period timer: ${displayTime.value} remaining`
})

/**
 * Handle timer tick - check for warning threshold. Reads the local timer; the
 * room path drives the same checks via the activeRemaining watcher below.
 */
function handleTick() {
  if (!hasWarned.value && timer.remaining.value <= WARNING_THRESHOLD_MS) {
    hasWarned.value = true
    notifications.notifyTimerWarning()
    emit('warning')
  }
  persist()
}

// Room path: warning + completion are driven by the server-derived remaining,
// not the local useTimer's onTick/onComplete (which run on unsynced local time).
watch(activeRemaining, (remaining) => {
  if (!useRoomTimer.value) return
  if (!hasWarned.value && remaining <= WARNING_THRESHOLD_MS && remaining > 0) {
    hasWarned.value = true
    notifications.notifyTimerWarning()
    emit('warning')
  }
  if (!hasCompleted.value && remaining <= 0) {
    handleComplete()
  }
})

/**
 * Host-only control: end the hiding period early. Only the host may do this
 * (offline the single device is the de-facto host). Requires a confirm click
 * so an accidental tap can't skip everyone straight to seeking — the transition
 * is irreversible. In a room it reuses the server-authoritative `start-seeking`
 * host action so every device transitions together; offline it drives the local
 * store directly.
 */
const canEndHiding = computed(() => !room.inRoom || room.isHost)
const showEndEarly = computed(
  () => canEndHiding.value && isHidingPeriod.value && !isExpired.value && !isPausedDisplay.value,
)
const confirmingEndEarly = ref(false)

function requestEndEarly() {
  confirmingEndEarly.value = true
}

function cancelEndEarly() {
  confirmingEndEarly.value = false
}

function confirmEndEarly() {
  confirmingEndEarly.value = false
  if (room.inRoom) {
    // Server-authoritative: broadcasts a `phase` to every client (incl. us).
    hostAction('start-seeking', GamePhase.Seeking)
  } else {
    gameStore.startSeeking()
  }
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
          // Timer should still be running — resume from the persisted elapsed.
          timer.start(totalElapsed)
        } else {
          // Timer would have completed while app was closed
          // Clear stale state and start fresh for new game
          persistenceService.remove(STORAGE_KEY)
          isRehydrating.value = false
          return false
        }
      } else if (state.isPaused) {
        // Timer was paused - restore that elapsed, then pause.
        timer.start(state.elapsed)
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
      startAligned()
      persist()
    } else if (!active) {
      timer.stop()
      stopRoomTick()
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

// Start the server-driven tick as soon as the room timer becomes drivable —
// phaseStartedAt often arrives (via welcome/phase) after this component mounts.
watch(useRoomTimer, (drivable) => {
  if (drivable && isHidingPeriod.value && !hasCompleted.value && !roomTick) startRoomTick()
  else if (!drivable) stopRoomTick()
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
    startAligned()
    persist()
  }
  // Ensure the server-driven tick runs whenever we're in a room mid-hiding —
  // e.g. after a rehydrate (mid-game refresh) that didn't go through startAligned.
  if (isHidingPeriod.value && useRoomTimer.value && !roomTick) startRoomTick()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopRoomTick()
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
      <p v-if="isPausedDisplay && !isExpired" class="timer-status-paused">
        <svg class="timer-status-icon-small" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
        Timer paused
      </p>
    </div>

    <!-- Control Buttons: hidden in a room — pause is host-authoritative and driven
         by GamePauseOverlay, so these local-only controls would desync the room. -->
    <div v-if="!isExpired && !room.inRoom" class="timer-controls">
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

    <!-- Host control: end the hiding period early (host-only; two-step confirm). -->
    <div v-if="showEndEarly" data-testid="end-hiding-early" class="timer-host-controls">
      <button
        v-if="!confirmingEndEarly"
        class="btn-show btn-show-secondary"
        data-testid="end-hiding-early-btn"
        aria-label="End hiding period now"
        @click="requestEndEarly"
      >
        <svg class="timer-btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"
          />
        </svg>
        End hiding period now
      </button>
      <template v-else>
        <p class="timer-host-confirm-text">End the hiding period and start seeking?</p>
        <div class="timer-host-confirm-actions">
          <button
            class="btn-show btn-show-danger"
            data-testid="end-hiding-early-confirm"
            aria-label="Confirm end hiding period"
            @click="confirmEndEarly"
          >
            Start seeking
          </button>
          <button
            class="btn-show btn-show-secondary"
            data-testid="end-hiding-early-cancel"
            aria-label="Cancel"
            @click="cancelEndEarly"
          >
            Cancel
          </button>
        </div>
      </template>
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

.timer-host-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.timer-host-confirm-text {
  font-size: 0.875rem;
  color: var(--color-ui-text-secondary);
  text-align: center;
}

.timer-host-confirm-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-show-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-show-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
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
