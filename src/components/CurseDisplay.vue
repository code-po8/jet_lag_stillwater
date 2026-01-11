<script setup lang="ts">
import { computed } from 'vue'
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

const cardStore = useCardStore()

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

          <!-- Duration -->
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
      </article>
    </div>
  </div>
</template>
