<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useCardStore, type ActiveCurse } from '@/stores/cardStore'
import { GameSize } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  }
)

// Emits
const emit = defineEmits<{
  (e: 'curseCleared', payload: { curseName: string; reason: 'manual' | 'expired' }): void
}>()

const cardStore = useCardStore()

// State for countdown updates
const now = ref(Date.now())
let countdownInterval: ReturnType<typeof setInterval> | null = null

// Computed
const activeCurses = computed(() => cardStore.activeCurses)
const curseCount = computed(() => activeCurses.value.length)
const hasActiveCurses = computed(() => curseCount.value > 0)

/**
 * Get the duration in minutes for a curse based on game size
 */
function getDuration(curse: ActiveCurse): number | null {
  if (!curse.durationMinutes) return null
  switch (props.gameSize) {
    case GameSize.Small:
      return curse.durationMinutes.small
    case GameSize.Medium:
      return curse.durationMinutes.medium
    case GameSize.Large:
      return curse.durationMinutes.large
    default:
      return curse.durationMinutes.small
  }
}

/**
 * Get the penalty in minutes for a curse based on game size
 */
function getPenalty(curse: ActiveCurse): number | null {
  if (!curse.penaltyMinutes) return null
  switch (props.gameSize) {
    case GameSize.Small:
      return curse.penaltyMinutes.small
    case GameSize.Medium:
      return curse.penaltyMinutes.medium
    case GameSize.Large:
      return curse.penaltyMinutes.large
    default:
      return curse.penaltyMinutes.small
  }
}

/**
 * Check if a curse is time-based (has duration)
 */
function isTimeBased(curse: ActiveCurse): boolean {
  return !!curse.durationMinutes
}

/**
 * Check if a curse can be manually cleared (action-based, not until-found, not time-based)
 */
function canManualClear(curse: ActiveCurse): boolean {
  return !curse.untilFound && !isTimeBased(curse)
}

/**
 * Get remaining time in milliseconds for a time-based curse
 */
function getRemainingMs(curse: ActiveCurse): number {
  const durationMin = getDuration(curse)
  if (durationMin === null) return 0

  const durationMs = durationMin * 60 * 1000
  const elapsed = now.value - curse.activatedAt.getTime()
  return Math.max(0, durationMs - elapsed)
}

/**
 * Format remaining time as MM:SS
 */
function formatRemainingTime(curse: ActiveCurse): string {
  const remainingMs = getRemainingMs(curse)
  const totalSeconds = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Handle manual clearing of a curse
 */
function handleClearCurse(curse: ActiveCurse): void {
  cardStore.clearCurse(curse.instanceId)
  emit('curseCleared', { curseName: curse.name, reason: 'manual' })
}

/**
 * Check for expired curses and auto-clear them
 */
function checkExpiredCurses(): void {
  const cursesToClear: ActiveCurse[] = []

  for (const curse of activeCurses.value) {
    if (isTimeBased(curse)) {
      const remaining = getRemainingMs(curse)
      if (remaining <= 0) {
        cursesToClear.push(curse)
      }
    }
  }

  for (const curse of cursesToClear) {
    cardStore.clearCurse(curse.instanceId)
    emit('curseCleared', { curseName: curse.name, reason: 'expired' })
  }
}

// Update countdown timer every second
onMounted(() => {
  countdownInterval = setInterval(() => {
    now.value = Date.now()
    checkExpiredCurses()
  }, 1000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
})

// Also check for expired curses when curses change
watch(activeCurses, () => {
  checkExpiredCurses()
}, { immediate: true })
</script>

<template>
  <div data-testid="curse-display-container" class="overflow-y-auto">
    <!-- Header -->
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-purple-300">Active Curses</h2>
      <span
        v-if="hasActiveCurses"
        data-testid="curse-count"
        class="rounded-full bg-purple-900 px-2 py-1 text-sm font-medium text-purple-200"
        aria-live="polite"
      >
        {{ curseCount }}
      </span>
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasActiveCurses"
      class="rounded-lg border border-purple-800/30 bg-purple-900/20 p-6 text-center"
    >
      <p class="text-slate-400">No active curses</p>
    </div>

    <!-- Curse List -->
    <div v-else class="flex flex-col gap-3">
      <article
        v-for="curse in activeCurses"
        :key="curse.instanceId"
        :data-testid="`curse-${curse.instanceId}`"
        :aria-label="`Active curse: ${curse.name}`"
        class="curse rounded-lg border border-purple-700/50 bg-purple-900/30 p-4"
      >
        <!-- Curse Header -->
        <div class="mb-2 flex items-start justify-between">
          <h3 class="font-semibold text-purple-200">{{ curse.name }}</h3>
          <div class="flex gap-1">
            <!-- Until Found Badge -->
            <span
              v-if="curse.untilFound"
              class="rounded-full bg-red-900/50 px-2 py-0.5 text-xs text-red-300"
            >
              Until Found
            </span>
          </div>
        </div>

        <!-- Description -->
        <p class="mb-3 text-sm text-slate-300">{{ curse.description }}</p>

        <!-- Effect Details -->
        <p class="mb-3 text-sm text-purple-300/80">{{ curse.effect }}</p>

        <!-- Status Badges -->
        <div class="flex flex-wrap gap-2 text-xs">
          <!-- Blocks Questions -->
          <span
            v-if="curse.blocksQuestions"
            class="rounded bg-amber-900/50 px-2 py-1 text-amber-300"
          >
            Blocks Questions
          </span>

          <!-- Blocks Transit -->
          <span
            v-if="curse.blocksTransit"
            class="rounded bg-red-900/50 px-2 py-1 text-red-300"
          >
            Blocks Transit
          </span>

          <!-- Duration (static display, shown for time-based curses) -->
          <span
            v-if="getDuration(curse)"
            class="rounded bg-blue-900/50 px-2 py-1 text-blue-300"
          >
            {{ getDuration(curse) }} min
          </span>

          <!-- Penalty -->
          <span
            v-if="getPenalty(curse)"
            class="rounded bg-orange-900/50 px-2 py-1 text-orange-300"
          >
            +{{ getPenalty(curse) }} min penalty
          </span>
        </div>

        <!-- Countdown Timer for Time-Based Curses -->
        <div v-if="isTimeBased(curse)" class="mt-3 flex items-center gap-2">
          <span
            data-testid="curse-countdown"
            class="rounded-lg bg-blue-800/50 px-3 py-2 font-mono text-lg font-bold text-blue-200"
          >
            {{ formatRemainingTime(curse) }}
          </span>
          <span class="text-sm text-blue-300">remaining</span>
        </div>

        <!-- Mark Complete Button for Action-Based Curses -->
        <div v-if="canManualClear(curse)" class="mt-3">
          <button
            type="button"
            class="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            @click="handleClearCurse(curse)"
          >
            Mark Complete
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
