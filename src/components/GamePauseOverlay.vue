<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

interface Props {
  role?: 'hider' | 'seeker'
}

withDefaults(defineProps<Props>(), {
  role: 'hider',
})

const gameStore = useGameStore()

const showPauseButton = computed(() => {
  return gameStore.canPauseGame && !gameStore.isGamePaused
})

const showOverlay = computed(() => {
  return gameStore.isGamePaused
})

function handlePause() {
  gameStore.pauseGame()
}

function handleResume() {
  gameStore.resumeGame()
}
</script>

<template>
  <!-- Pause Button -->
  <button
    v-if="showPauseButton"
    class="min-h-11 rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-600"
    aria-label="Pause game"
    @click="handlePause"
  >
    Pause Game
  </button>

  <!-- Pause Overlay -->
  <Teleport to="body">
    <div
      v-if="showOverlay"
      data-testid="game-pause-overlay"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      aria-label="Game paused overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex flex-col items-center gap-6 rounded-xl bg-slate-800 p-8 shadow-2xl">
        <h2 class="text-3xl font-bold text-white">Game Paused</h2>
        <p class="text-slate-400">All timers stopped</p>
        <button
          class="min-h-11 min-w-32 rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Resume game"
          @click="handleResume"
        >
          Resume Game
        </button>
      </div>
    </div>
  </Teleport>
</template>
