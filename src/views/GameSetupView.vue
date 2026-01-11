<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { GameSize } from '@/types/question'

const router = useRouter()
const gameStore = useGameStore()

// Form state
const newPlayerName = ref('')
const selectedGameSize = ref<GameSize>(GameSize.Small)
const selectedHiderIndex = ref<number | null>(null)
const showConfirmation = ref(false)

// Constants
const MAX_PLAYERS = 4
const MIN_PLAYERS = 2

// Computed properties
const canAddPlayer = computed(() => {
  return gameStore.players.length < MAX_PLAYERS && newPlayerName.value.trim() !== ''
})

const canAddMorePlayers = computed(() => {
  return gameStore.players.length < MAX_PLAYERS
})

const hasEnoughPlayers = computed(() => {
  return gameStore.players.length >= MIN_PLAYERS
})

const selectedHider = computed(() => {
  if (selectedHiderIndex.value === null) return null
  return gameStore.players[selectedHiderIndex.value] ?? null
})

const canStartGame = computed(() => {
  return hasEnoughPlayers.value && selectedHider.value !== null
})

// Actions
function addPlayer() {
  const trimmedName = newPlayerName.value.trim()
  if (trimmedName === '' || gameStore.players.length >= MAX_PLAYERS) {
    return
  }
  gameStore.addPlayer(trimmedName)
  newPlayerName.value = ''
}

function removePlayer(playerId: string) {
  const removedIndex = gameStore.players.findIndex((p) => p.id === playerId)
  gameStore.removePlayer(playerId)

  // Adjust selected hider index if needed
  if (selectedHiderIndex.value !== null) {
    if (removedIndex === selectedHiderIndex.value) {
      selectedHiderIndex.value = null
    } else if (removedIndex < selectedHiderIndex.value) {
      selectedHiderIndex.value--
    }
  }
}

function selectGameSize(size: GameSize) {
  selectedGameSize.value = size
}

function selectHider(index: number) {
  selectedHiderIndex.value = index
}

function randomizeHider() {
  if (gameStore.players.length > 0) {
    selectedHiderIndex.value = Math.floor(Math.random() * gameStore.players.length)
  }
}

function handleStartClick() {
  if (!canStartGame.value) return
  showConfirmation.value = true
}

function cancelConfirmation() {
  showConfirmation.value = false
}

function confirmStart() {
  if (!selectedHider.value) return

  gameStore.startRound(selectedHider.value.id)
  showConfirmation.value = false
  router.push({ name: 'game' })
}
</script>

<template>
  <main
    class="min-h-screen bg-slate-900 text-white p-4 overflow-y-auto"
    data-testid="setup-container"
  >
    <div class="max-w-md mx-auto">
      <!-- Header -->
      <h1 class="text-2xl font-bold text-center mb-6">Game Setup</h1>

      <!-- Player Management Section -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Players</h2>

        <!-- Add Player Form -->
        <div class="flex gap-2 mb-4">
          <label class="sr-only" for="player-name-input">Player Name</label>
          <input
            id="player-name-input"
            v-model="newPlayerName"
            type="text"
            placeholder="Player name"
            class="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            @keyup.enter="addPlayer"
          />
          <button
            type="button"
            :disabled="!canAddPlayer || !canAddMorePlayers"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium min-h-11 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            @click="addPlayer"
          >
            Add Player
          </button>
        </div>

        <!-- Player List -->
        <ul class="space-y-2">
          <li
            v-for="player in gameStore.players"
            :key="player.id"
            :data-testid="`player-${player.id}`"
            class="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg"
          >
            <span>{{ player.name }}</span>
            <button
              type="button"
              class="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
              aria-label="Remove"
              @click="removePlayer(player.id)"
            >
              Remove
            </button>
          </li>
        </ul>

        <p v-if="gameStore.players.length === 0" class="text-slate-400 text-sm mt-2">
          Add at least 2 players to start
        </p>
        <p v-else-if="gameStore.players.length < MIN_PLAYERS" class="text-slate-400 text-sm mt-2">
          Add {{ MIN_PLAYERS - gameStore.players.length }} more player{{
            MIN_PLAYERS - gameStore.players.length > 1 ? 's' : ''
          }}
          to start
        </p>
      </section>

      <!-- Game Size Section -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Game Size</h2>
        <div class="flex gap-2">
          <button
            v-for="size in [GameSize.Small, GameSize.Medium, GameSize.Large]"
            :key="size"
            :data-testid="`game-size-${size}`"
            :aria-selected="selectedGameSize === size"
            class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            :class="
              selectedGameSize === size
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="selectGameSize(size)"
          >
            {{ size.charAt(0).toUpperCase() + size.slice(1) }}
          </button>
        </div>
        <p class="text-slate-400 text-sm mt-2">
          <template v-if="selectedGameSize === GameSize.Small">
            Recommended for Stillwater - fewer questions, faster games
          </template>
          <template v-else-if="selectedGameSize === GameSize.Medium">
            More questions including Tentacle category
          </template>
          <template v-else>
            Full question set - best for large play areas
          </template>
        </p>
      </section>

      <!-- Hider Selection Section -->
      <section v-if="hasEnoughPlayers" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Choose First Hider</h2>
          <button
            type="button"
            class="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            @click="randomizeHider"
          >
            Random
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(player, playerIndex) in gameStore.players"
            :key="player.id"
            :data-testid="`hider-option-${playerIndex}`"
            :aria-selected="selectedHiderIndex === playerIndex"
            class="px-4 py-3 rounded-lg font-medium transition-colors"
            :class="
              selectedHiderIndex === playerIndex
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="selectHider(playerIndex)"
          >
            {{ player.name }}
          </button>
        </div>
      </section>

      <!-- Start Game Button -->
      <button
        type="button"
        :disabled="!canStartGame"
        class="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold text-lg min-h-11 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
        @click="handleStartClick"
      >
        Start Game
      </button>

      <!-- Confirmation Modal -->
      <div
        v-if="showConfirmation"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <div class="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
          <h3 class="text-xl font-bold mb-4">Confirm Game Start</h3>
          <p class="text-slate-300 mb-4">
            <span class="font-semibold text-amber-400">{{ selectedHider?.name }}</span> will be the
            hider for this round.
          </p>
          <p class="text-slate-400 text-sm mb-6">
            Game Size: {{ selectedGameSize.charAt(0).toUpperCase() + selectedGameSize.slice(1) }}
            <br />
            Players: {{ gameStore.players.map((p) => p.name).join(', ') }}
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              @click="cancelConfirmation"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              @click="confirmStart"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
