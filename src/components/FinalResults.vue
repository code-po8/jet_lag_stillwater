<script setup lang="ts">
/**
 * Final Results Component (GS-006)
 *
 * Displays the final game results when all players have been hider:
 * - All players ranked by total hiding time
 * - Winner prominently announced
 * - Option to start new game or return home
 */

import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { formatTime } from '@/utils/formatTime'

const emit = defineEmits<{
  'new-game': []
  'return-home': []
}>()

const gameStore = useGameStore()

// Computed properties
const playersRanked = computed(() => gameStore.playersRankedByTime)
const winner = computed(() => playersRanked.value[0] ?? null)
const totalRounds = computed(() => gameStore.roundNumber)
const totalGameTimeMs = computed(() =>
  gameStore.players.reduce((sum, player) => sum + player.totalHidingTimeMs, 0)
)

/**
 * Get ordinal suffix for rank (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'] as const
  const v = n % 100
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0]
  return n + suffix
}

/**
 * Handle starting a new game
 */
function handleNewGame() {
  emit('new-game')
}

/**
 * Handle returning home
 */
function handleReturnHome() {
  emit('return-home')
}
</script>

<template>
  <div
    data-testid="final-results"
    class="flex min-h-screen flex-col gap-6 overflow-y-auto bg-slate-900 p-4"
  >
    <!-- Celebratory Header -->
    <header class="text-center">
      <div class="mb-2 text-5xl">🏆</div>
      <h1 class="text-3xl font-bold text-white">Game Over!</h1>
      <p class="mt-2 text-slate-400">Final Results</p>
    </header>

    <!-- Winner Announcement -->
    <section
      v-if="winner"
      data-testid="winner-announcement"
      role="alert"
      aria-live="polite"
      class="rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 p-6 text-center shadow-lg"
    >
      <p class="text-sm font-medium uppercase tracking-wide text-amber-100">Winner</p>
      <p class="mt-1 text-3xl font-bold text-white">{{ winner.name }}</p>
      <p class="mt-2 font-mono text-2xl text-amber-100">{{ formatTime(winner.totalHidingTimeMs) }}</p>
      <p class="mt-1 text-sm text-amber-200">Total Hiding Time</p>
    </section>

    <!-- Final Leaderboard -->
    <section class="rounded-lg bg-slate-800 p-4">
      <h2 class="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">Final Standings</h2>
      <div data-testid="final-leaderboard" class="flex flex-col gap-2">
        <div
          v-for="(player, index) in playersRanked"
          :key="player.id"
          :data-testid="`final-leaderboard-entry-${index}`"
          :class="[
            'flex items-center justify-between rounded-lg p-4',
            index === 0
              ? 'bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border border-amber-500/50 first-place'
              : index === 1
                ? 'bg-slate-700/70 border border-slate-600'
                : index === 2
                  ? 'bg-slate-700/50 border border-slate-600/50'
                  : 'bg-slate-700/30',
          ]"
        >
          <div class="flex items-center gap-4">
            <!-- Rank -->
            <span
              :class="[
                'text-lg font-bold',
                index === 0 ? 'text-amber-400' : 'text-slate-400',
              ]"
            >
              {{ getOrdinal(index + 1) }}
            </span>
            <!-- Player Name -->
            <span
              :class="[
                'font-semibold',
                index === 0 ? 'text-amber-300' : 'text-white',
              ]"
            >
              {{ player.name }}
            </span>
            <!-- Trophy for winner -->
            <span v-if="index === 0" class="text-xl">🥇</span>
            <span v-else-if="index === 1" class="text-xl">🥈</span>
            <span v-else-if="index === 2" class="text-xl">🥉</span>
          </div>
          <!-- Time -->
          <span class="font-mono text-lg text-slate-300">
            {{ formatTime(player.totalHidingTimeMs) }}
          </span>
        </div>
      </div>
    </section>

    <!-- Game Statistics -->
    <section class="rounded-lg bg-slate-800/50 p-4">
      <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">Game Stats</h2>
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-white">{{ totalRounds }}</p>
          <p class="text-xs text-slate-400">Rounds Played</p>
        </div>
        <div data-testid="total-game-time">
          <p class="font-mono text-2xl font-bold text-white">{{ formatTime(totalGameTimeMs) }}</p>
          <p class="text-xs text-slate-400">Total Hiding Time</p>
        </div>
      </div>
    </section>

    <!-- Action Buttons -->
    <footer class="mt-auto flex flex-col gap-3 pt-4">
      <button
        type="button"
        class="min-h-11 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-500"
        @click="handleNewGame"
      >
        New Game
      </button>
      <button
        type="button"
        class="min-h-11 rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-600"
        @click="handleReturnHome"
      >
        Return Home
      </button>
    </footer>
  </div>
</template>
