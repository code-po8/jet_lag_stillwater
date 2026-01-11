<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore } from '@/stores/gameStore'
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
      emit('lowTime')
    }

    // Check for expiration
    if (remaining.value <= 0 && !hasExpired.value) {
      hasExpired.value = true
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
watch(
  isGamePaused,
  (paused) => {
    if (!hasPendingQuestion.value || !isRunning.value) return

    if (paused && !isPaused.value) {
      pauseTimer()
    } else if (!paused && isPaused.value) {
      resumeTimer()
    }
  },
)

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
    class="flex flex-col items-center gap-3 rounded-lg bg-slate-800 p-4"
    :class="timerClasses"
    :aria-label="ariaLabel"
    role="timer"
  >
    <!-- Category Display -->
    <div class="text-sm font-medium text-slate-400">
      <span class="capitalize">{{ pendingCategory?.name }}</span> Question
    </div>

    <!-- Timer Display -->
    <div
      data-testid="timer-display"
      class="font-mono text-3xl font-bold"
      :class="{
        'text-white': !isLowTime && !isExpiredState,
        'text-orange-400': isLowTime && !isExpiredState,
        'text-red-400': isExpiredState,
      }"
    >
      {{ displayTime }}
    </div>

    <!-- Status Messages -->
    <div class="text-center">
      <!-- Expired Message -->
      <p v-if="isExpiredState" class="text-sm font-semibold text-red-400">Time expired!</p>

      <!-- Role-specific Message -->
      <p v-else class="text-sm text-slate-400">
        {{ roleMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.low-time {
  border: 2px solid rgba(251, 146, 60, 0.5);
  background-color: rgba(154, 52, 18, 0.3);
}

.expired {
  border: 2px solid rgba(239, 68, 68, 0.5);
  background-color: rgba(127, 29, 29, 0.3);
}
</style>
