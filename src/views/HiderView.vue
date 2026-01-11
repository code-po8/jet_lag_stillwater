<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useCardStore } from '@/stores/cardStore'
import CardHand from '@/components/CardHand.vue'
import { GameSize } from '@/types/question'

// Props
defineProps<{
  gameSize?: GameSize
}>()

const gameStore = useGameStore()
const cardStore = useCardStore()

// Computed properties
const currentPhase = computed(() => gameStore.currentPhase)
const totalTimeBonus = computed(() => cardStore.totalTimeBonus(GameSize.Small))

/**
 * Get display text for the current phase
 */
function getPhaseDisplayText(): string {
  switch (currentPhase.value) {
    case 'hiding-period':
      return 'Hiding Period - Find your spot!'
    case 'seeking':
      return 'Seekers are on the move'
    case 'end-game':
      return 'Seekers in your zone!'
    default:
      return currentPhase.value
  }
}
</script>

<template>
  <div data-testid="hider-view" class="flex flex-col gap-4 p-4">
    <!-- Role Indicator -->
    <div data-testid="role-indicator" class="text-center text-xl font-bold text-amber-400">
      Hider
    </div>

    <!-- Phase Status -->
    <div
      data-testid="phase-status"
      class="rounded-lg bg-slate-800 p-3 text-center text-slate-300"
    >
      {{ getPhaseDisplayText() }}
    </div>

    <!-- Time Bonus Total -->
    <div
      data-testid="time-bonus-total"
      class="flex items-center justify-between rounded-lg bg-green-900/50 p-4"
    >
      <span class="text-lg font-medium text-green-200">Total Time Bonus</span>
      <span class="text-2xl font-bold text-green-400">+{{ totalTimeBonus }} min</span>
    </div>

    <!-- Cards Section -->
    <section data-testid="hider-cards-section" class="flex-1">
      <h2 class="mb-3 text-lg font-semibold text-white">Your Cards</h2>
      <CardHand :game-size="gameSize ?? GameSize.Small" />
    </section>
  </div>
</template>
