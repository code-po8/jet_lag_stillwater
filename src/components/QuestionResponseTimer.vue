<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore } from '@/stores/gameStore'
import { useNotifications } from '@/composables/useNotifications'
import { formatTimeShort } from '@/utils/formatTime'
import { getCategoryById, getResponseTime, GameSize } from '@/types/question'

const LOW_TIME_THRESHOLD_MS = 60 * 1000 // 1 minute

interface Props {
  role?: 'hider' | 'seeker'
  gameSize?: GameSize
}

const props = withDefaults(defineProps<Props>(), {
  role: 'hider',
  gameSize: GameSize.Small,
})

const emit = defineEmits<{
  lowTime: []
  expired: []
}>()

const questionStore = useQuestionStore()
const gameStore = useGameStore()
const notifications = useNotifications()

// Timer state - managed manually for dynamic initial times
const elapsed = ref(0)
const isRunning = ref(false)
const isPaused = ref(false)
const initialTimeMs = ref(5 * 60 * 1000) // Default to 5 minutes
const hasAlerted = ref(false)
const hasExpired = ref(false)

let intervalId: ReturnType<typeof setInterval> | null = null
let startTimestamp: number | null = null
let pausedElapsed = 0

const isGamePaused = computed(() => gameStore.isGamePaused)

// Computed values
const hasPendingQuestion = computed(() => questionStore.hasPendingQuestion)

const pendingCategoryId = computed(() => {
  return questionStore.pendingQuestion?.categoryId
})

const pendingCategory = computed(() => {
  if (!pendingCategoryId.value) return null
  return getCategoryById(pendingCategoryId.value)
})

const remaining = computed(() => {
  return Math.max(0, initialTimeMs.value - elapsed.value)
})

const displayTime = computed(() => {
  return formatTimeShort(remaining.value)
})

const isLowTime = computed(() => {
  return remaining.value <= LOW_TIME_THRESHOLD_MS && remaining.value > 0
})

const isExpiredState = computed(() => {
  return remaining.value <= 0 && hasExpired.value
})

const timerClasses = computed(() => ({
  'low-time': isLowTime.value && !isExpiredState.value,
  expired: isExpiredState.value,
}))

const ariaLabel = computed(() => {
  if (isExpiredState.value) {
    return 'Question response timer expired'
  }
  if (!hasPendingQuestion.value) {
    return 'No question pending'
  }
  return `Question response timer: ${displayTime.value} remaining`
})

const roleMessage = computed(() => {
  if (props.role === 'hider') {
    return 'Respond to the question'
  }
  return 'Waiting for hider response'
})

/**
 * Get response time in milliseconds for the current pending question
 */
function getResponseTimeMs(): number {
  if (!pendingCategory.value) return 5 * 60 * 1000 // Default 5 minutes
  const minutes = getResponseTime(pendingCategory.value, props.gameSize)
  return minutes * 60 * 1000
}

/**
 * Handle timer tick
 */
function tick() {
  if (isPaused.value) return

  if (startTimestamp !== null) {
    elapsed.value = pausedElapsed + (Date.now() - startTimestamp)

    // Check for low time alert
    if (!hasAlerted.value && remaining.value <= LOW_TIME_THRESHOLD_MS) {
      hasAlerted.value = true
      notifications.notify('Less than 1 minute to respond!', 'warning', {
        soundType: 'timer-warning',
        vibratePattern: 'double',
      })
      emit('lowTime')
    }

    // Check for expiration
    if (remaining.value <= 0 && !hasExpired.value) {
      hasExpired.value = true
      notifications.notifyTimerExpired()
      emit('expired')
      stopTimer()
    }
  }
}

/**
 * Pause the timer
 */
function pauseTimer() {
  if (!isRunning.value || isPaused.value) return

  isPaused.value = true
  pausedElapsed = elapsed.value
  startTimestamp = null
}

/**
 * Resume the timer
 */
function resumeTimer() {
  if (!isRunning.value || !isPaused.value) return

  isPaused.value = false
  startTimestamp = Date.now()
}

/**
 * Start the timer for the current pending question
 */
function startTimer() {
  stopTimer() // Clear any existing timer

  const responseTimeMs = getResponseTimeMs()
  initialTimeMs.value = responseTimeMs
  elapsed.value = 0
  pausedElapsed = 0
  isPaused.value = false
  hasAlerted.value = false
  hasExpired.value = false
  isRunning.value = true
  startTimestamp = Date.now()

  intervalId = setInterval(tick, 100)
}

/**
 * Stop and reset the timer
 */
function stopTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  isRunning.value = false
  isPaused.value = false
  startTimestamp = null
  pausedElapsed = 0
}

// Watch for pending question changes
watch(
  () => questionStore.pendingQuestion,
  (newPending, oldPending) => {
    if (newPending && !oldPending) {
      // New question just asked - start timer
      startTimer()
    } else if (!newPending && oldPending) {
      // Question answered or vetoed - stop timer
      stopTimer()
      elapsed.value = 0
      hasAlerted.value = false
      hasExpired.value = false
    } else if (newPending && oldPending && newPending.questionId !== oldPending.questionId) {
      // Question changed (e.g., randomized) - restart timer
      startTimer()
    }
  },
  { immediate: true },
)

// Watch for game size changes (recalculate response time)
watch(
  () => props.gameSize,
  () => {
    if (hasPendingQuestion.value && isRunning.value) {
      // Restart with new response time
      startTimer()
    }
  },
)

// Watch for game-level pause/resume
watch(isGamePaused, (paused) => {
  if (!hasPendingQuestion.value || !isRunning.value) return

  if (paused && !isPaused.value) {
    pauseTimer()
  } else if (!paused && isPaused.value) {
    resumeTimer()
  }
})

onMounted(() => {
  // If there's already a pending question, start the timer
  if (questionStore.pendingQuestion) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div
    v-if="hasPendingQuestion"
    data-testid="question-response-timer"
    class="response-timer"
    :class="timerClasses"
    :aria-label="ariaLabel"
    role="timer"
  >
    <!-- Timer Header -->
    <div class="response-timer-header">
      <svg class="response-timer-icon" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
        />
      </svg>
      <span class="response-timer-category">{{ pendingCategory?.name }} Question</span>
    </div>

    <!-- Timer Display -->
    <div
      data-testid="timer-display"
      class="response-timer-display"
      :class="{
        'timer-normal': !isLowTime && !isExpiredState,
        'timer-low': isLowTime && !isExpiredState,
        'timer-expired': isExpiredState,
      }"
    >
      {{ displayTime }}
    </div>

    <!-- Status Messages -->
    <div class="response-timer-status">
      <!-- Expired Message -->
      <p v-if="isExpiredState" class="response-timer-expired">
        <svg class="response-timer-status-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          />
        </svg>
        Time expired!
      </p>

      <!-- Role-specific Message -->
      <p v-else class="response-timer-message">
        {{ roleMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.response-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.response-timer-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.response-timer-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-brand-orange);
}

.response-timer-category {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ui-text-secondary);
  text-transform: capitalize;
}

.response-timer-display {
  font-family: var(--font-display);
  font-size: 2.5rem;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.timer-normal {
  color: white;
}

.timer-low {
  color: var(--color-brand-orange);
  animation: pulse-timer 1s ease-in-out infinite;
}

.timer-expired {
  color: var(--color-status-error);
}

@keyframes pulse-timer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.response-timer-status {
  text-align: center;
}

.response-timer-expired {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-status-error);
}

.response-timer-status-icon {
  width: 1rem;
  height: 1rem;
}

.response-timer-message {
  font-size: 0.875rem;
  color: var(--color-ui-text-muted);
}

/* State modifiers */
.low-time {
  border-color: rgba(240, 125, 46, 0.4);
  background: linear-gradient(135deg, rgba(154, 52, 18, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.expired {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%);
}
</style>
