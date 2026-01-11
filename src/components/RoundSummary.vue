<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useCardStore } from '@/stores/cardStore'
import { GameSize } from '@/types/question'
import { formatTime } from '@/utils/formatTime'

const props = withDefaults(
  defineProps<{
    hidingTimeMs: number
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  }
)

const emit = defineEmits<{
  'start-next-round': []
  'end-game': []
}>()

const gameStore = useGameStore()
const cardStore = useCardStore()

// Computed properties
const isRoundComplete = computed(() => gameStore.currentPhase === GamePhase.RoundComplete)
const currentHider = computed(() => gameStore.currentHider)
const roundNumber = computed(() => gameStore.roundNumber)
const allPlayersHaveBeenHider = computed(() => gameStore.allPlayersHaveBeenHider)
const playersRanked = computed(() => gameStore.playersRankedByTime)

// Time bonus calculation
const timeBonusMinutes = computed(() => cardStore.totalTimeBonus(props.gameSize))
const timeBonusMs = computed(() => timeBonusMinutes.value * 60 * 1000)

// Total score (hiding time + time bonus)
const totalScoreMs = computed(() => props.hidingTimeMs + timeBonusMs.value)

// Format times for display
const formattedHidingTime = computed(() => formatTime(props.hidingTimeMs))
const formattedTotalScore = computed(() => formatTime(totalScoreMs.value))

/**
 * Handle starting the next round
 */
function handleStartNextRound() {
  // Record the hiding time and transition to setup
  gameStore.endRound(props.hidingTimeMs)
  emit('start-next-round')
}

/**
 * Handle ending the game
 */
function handleEndGame() {
  // Record the hiding time before ending
  gameStore.endRound(props.hidingTimeMs)
  emit('end-game')
}
</script>

<template>
  <div
    v-if="isRoundComplete"
    data-testid="round-summary"
    class="flex flex-col gap-6 overflow-y-auto p-4"
  >
    <!-- Header -->
    <header class="text-center">
      <h2 class="text-2xl font-bold text-white">Round {{ roundNumber }} Complete!</h2>
      <p class="mt-2 text-slate-400">
        <span data-testid="hider-name" class="font-semibold text-amber-400">{{ currentHider?.name }}</span>
        was found
      </p>
    </header>

    <!-- Final Hiding Time -->
    <section class="rounded-lg bg-slate-800 p-4 text-center">
      <p class="text-sm uppercase tracking-wide text-slate-400">Hiding Time</p>
      <p data-testid="hiding-time" class="text-4xl font-mono font-bold text-white">
        {{ formattedHidingTime }}
      </p>
    </section>

    <!-- Time Bonus Section -->
    <section data-testid="time-bonus-section" class="rounded-lg bg-slate-800 p-4">
      <div class="flex items-center justify-between">
        <span class="text-slate-400">Time Bonus</span>
        <span data-testid="time-bonus-value" class="font-mono font-semibold text-green-400">
          +{{ timeBonusMinutes }} min
        </span>
      </div>
      <p class="mt-1 text-xs text-slate-500">
        From {{ cardStore.timeBonusCards.length }} time bonus card{{ cardStore.timeBonusCards.length === 1 ? '' : 's' }}
      </p>
    </section>

    <!-- Total Score -->
    <section class="rounded-lg bg-amber-900/30 border border-amber-500/50 p-4 text-center">
      <p class="text-sm uppercase tracking-wide text-amber-400">Total Score</p>
      <p data-testid="total-score" class="text-3xl font-mono font-bold text-white">
        {{ formattedTotalScore }}
      </p>
    </section>

    <!-- Leaderboard -->
    <section class="rounded-lg bg-slate-800 p-4">
      <h3 class="mb-3 text-sm uppercase tracking-wide text-slate-400">Leaderboard</h3>
      <div data-testid="leaderboard" class="flex flex-col gap-2">
        <div
          v-for="(player, index) in playersRanked"
          :key="player.id"
          :data-testid="`leaderboard-entry-${index}`"
          :class="[
            'flex items-center justify-between rounded-lg p-3',
            player.id === currentHider?.id
              ? 'bg-amber-900/30 border border-amber-500/50'
              : 'bg-slate-700/50',
          ]"
        >
          <div class="flex items-center gap-3">
            <span class="font-mono text-slate-400">{{ index + 1 }}.</span>
            <span
              :class="[
                'font-medium',
                player.id === currentHider?.id ? 'text-amber-400' : 'text-white',
              ]"
            >
              {{ player.name }}
            </span>
            <span
              v-if="player.id === currentHider?.id"
              class="rounded-full bg-amber-600 px-2 py-0.5 text-xs text-white"
            >
              This round
            </span>
          </div>
          <span class="font-mono text-slate-300">
            {{ formatTime(player.totalHidingTimeMs + (player.id === currentHider?.id ? props.hidingTimeMs : 0)) }}
          </span>
        </div>
      </div>
    </section>

    <!-- Action Buttons -->
    <footer class="flex flex-col gap-3">
      <button
        v-if="!allPlayersHaveBeenHider"
        type="button"
        class="min-h-11 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
        @click="handleStartNextRound"
      >
        Start Next Round
      </button>

      <button
        v-if="allPlayersHaveBeenHider"
        type="button"
        class="min-h-11 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-500"
        @click="handleEndGame"
      >
        End Game - See Final Results
      </button>
    </footer>
  </div>
</template>
