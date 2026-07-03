<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useGameSync } from '@/composables/useGameSync'
import { useNotifications } from '@/composables/useNotifications'

interface Props {
  role?: 'hider' | 'seeker'
}

withDefaults(defineProps<Props>(), {
  role: 'hider',
})

const gameStore = useGameStore()
const room = useRoomStore()
const { hostAction } = useGameSync()
const notifications = useNotifications()

// In a multiplayer room pause/resume is host-authoritative (server enforces it),
// so only the host drives it; offline, anyone on the device can.
const canControl = computed(() => !room.inRoom || room.isHost)

const showPauseButton = computed(() => {
  return canControl.value && gameStore.canPauseGame && !gameStore.isGamePaused
})

const showOverlay = computed(() => {
  return gameStore.isGamePaused
})

function handlePause() {
  gameStore.pauseGame()
  notifications.notifyGamePaused()
  // Broadcast so every device pauses. The inbound bridge applies it on others;
  // hostAction is a no-op for non-hosts (and the button is hidden for them).
  if (room.inRoom) hostAction('pause')
}

function handleResume() {
  gameStore.resumeGame()
  notifications.notifyGameResumed()
  if (room.inRoom) hostAction('resume')
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
          v-if="canControl"
          class="min-h-11 min-w-32 rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Resume game"
          @click="handleResume"
        >
          Resume Game
        </button>
        <p v-else data-testid="pause-waiting" class="text-slate-400">
          Waiting for the host to resume…
        </p>
      </div>
    </div>
  </Teleport>
</template>
