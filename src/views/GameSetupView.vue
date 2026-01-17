<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { GameSize } from '@/types/question'
import JetLagLogo from '@/components/JetLagLogo.vue'

const router = useRouter()
const gameStore = useGameStore()

// Template refs
const playerNameInputRef = ref<HTMLInputElement | null>(null)

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
async function addPlayer() {
  const trimmedName = newPlayerName.value.trim()
  if (trimmedName === '' || gameStore.players.length >= MAX_PLAYERS) {
    return
  }
  gameStore.addPlayer(trimmedName)
  newPlayerName.value = ''

  // Focus the input for the next entry (UX-005)
  await nextTick()
  playerNameInputRef.value?.focus()
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
  <main class="setup-view page-bg-gradient" data-testid="setup-container">
    <!-- Header Banner with Logo -->
    <header class="show-header">
      <div class="setup-header-content">
        <div data-testid="setup-logo-container" class="setup-logo-container">
          <JetLagLogo size="sm" />
        </div>
        <h1 class="show-header-title">GAME SETUP</h1>
      </div>
    </header>

    <div class="setup-content">
      <!-- Player Management Section -->
      <section class="setup-section">
        <div class="setup-section-header">
          <h2 class="setup-section-title">
            <svg class="setup-section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </svg>
            Players
          </h2>
          <span class="setup-badge">{{ gameStore.players.length }}/{{ MAX_PLAYERS }}</span>
        </div>

        <!-- Add Player Form -->
        <div class="setup-input-group">
          <label class="sr-only" for="player-name-input">Player Name</label>
          <input
            id="player-name-input"
            ref="playerNameInputRef"
            v-model="newPlayerName"
            type="text"
            placeholder="Enter player name..."
            class="setup-input"
            @keyup.enter="addPlayer"
          />
          <button
            type="button"
            :disabled="!canAddPlayer || !canAddMorePlayers"
            class="btn-show btn-show-primary setup-add-btn"
            @click="addPlayer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="setup-btn-icon">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add
          </button>
        </div>

        <!-- Player List -->
        <ul v-if="gameStore.players.length > 0" class="setup-player-list">
          <li
            v-for="player in gameStore.players"
            :key="player.id"
            :data-testid="`player-${player.id}`"
            class="setup-player-item"
          >
            <div class="setup-player-avatar">
              {{ player.name.charAt(0).toUpperCase() }}
            </div>
            <span class="setup-player-name">{{ player.name }}</span>
            <button
              type="button"
              class="setup-remove-btn"
              aria-label="Remove"
              @click="removePlayer(player.id)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </button>
          </li>
        </ul>

        <p v-if="gameStore.players.length === 0" class="setup-hint">
          Add at least 2 players to start
        </p>
        <p v-else-if="gameStore.players.length < MIN_PLAYERS" class="setup-hint">
          Add {{ MIN_PLAYERS - gameStore.players.length }} more player{{
            MIN_PLAYERS - gameStore.players.length > 1 ? 's' : ''
          }}
          to start
        </p>
      </section>

      <!-- Game Size Section -->
      <section class="setup-section">
        <div class="setup-section-header">
          <h2 class="setup-section-title">
            <svg class="setup-section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
              />
            </svg>
            Game Size
          </h2>
        </div>
        <div class="setup-size-grid">
          <button
            v-for="size in [GameSize.Small, GameSize.Medium, GameSize.Large]"
            :key="size"
            :data-testid="`game-size-${size}`"
            :aria-selected="selectedGameSize === size"
            class="setup-size-btn"
            :class="{ 'setup-size-btn-active': selectedGameSize === size }"
            @click="selectGameSize(size)"
          >
            <span class="setup-size-label">{{ size.charAt(0).toUpperCase() + size.slice(1) }}</span>
            <span class="setup-size-desc">
              <template v-if="size === GameSize.Small">~45 min</template>
              <template v-else-if="size === GameSize.Medium">~90 min</template>
              <template v-else>~120 min</template>
            </span>
          </button>
        </div>
        <p class="setup-hint setup-size-hint">
          <template v-if="selectedGameSize === GameSize.Small">
            Recommended for Stillwater - fewer questions, faster games
          </template>
          <template v-else-if="selectedGameSize === GameSize.Medium">
            More questions including Tentacle category
          </template>
          <template v-else> Full question set - best for large play areas </template>
        </p>
      </section>

      <!-- Hider Selection Section -->
      <section v-if="hasEnoughPlayers" class="setup-section">
        <div class="setup-section-header">
          <h2 class="setup-section-title">
            <svg class="setup-section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
              />
            </svg>
            Choose First Hider
          </h2>
          <button type="button" class="setup-random-btn" @click="randomizeHider">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
              />
            </svg>
            Random
          </button>
        </div>
        <div class="setup-hider-grid">
          <button
            v-for="(player, playerIndex) in gameStore.players"
            :key="player.id"
            :data-testid="`hider-option-${playerIndex}`"
            :aria-selected="selectedHiderIndex === playerIndex"
            class="setup-hider-btn"
            :class="{ 'setup-hider-btn-active': selectedHiderIndex === playerIndex }"
            @click="selectHider(playerIndex)"
          >
            <span
              class="setup-hider-avatar"
              :class="{ 'setup-hider-avatar-active': selectedHiderIndex === playerIndex }"
            >
              {{ player.name.charAt(0).toUpperCase() }}
            </span>
            <span class="setup-hider-name">{{ player.name }}</span>
            <svg
              v-if="selectedHiderIndex === playerIndex"
              class="setup-hider-check"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Start Game Button -->
      <button
        type="button"
        :disabled="!canStartGame"
        class="btn-show btn-show-success setup-start-btn"
        @click="handleStartClick"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="setup-start-icon">
          <path d="M8 5v14l11-7z" />
        </svg>
        Start Game
      </button>

      <!-- Confirmation Modal -->
      <Teleport to="body">
        <div v-if="showConfirmation" class="modal-overlay" @click.self="cancelConfirmation">
          <div class="modal-content">
            <header class="modal-header">
              <h3 class="modal-title">CONFIRM GAME START</h3>
            </header>
            <div class="modal-body">
              <div class="setup-confirm-hider">
                <div class="setup-confirm-avatar">
                  {{ selectedHider?.name.charAt(0).toUpperCase() }}
                </div>
                <div class="setup-confirm-info">
                  <span class="setup-confirm-label">First Hider</span>
                  <span class="setup-confirm-name">{{ selectedHider?.name }}</span>
                </div>
              </div>
              <div class="setup-confirm-details">
                <div class="setup-confirm-row">
                  <span>Game Size</span>
                  <span class="setup-confirm-value">{{
                    selectedGameSize.charAt(0).toUpperCase() + selectedGameSize.slice(1)
                  }}</span>
                </div>
                <div class="setup-confirm-row">
                  <span>Players</span>
                  <span class="setup-confirm-value">{{
                    gameStore.players.map((p) => p.name).join(', ')
                  }}</span>
                </div>
              </div>
            </div>
            <footer class="modal-footer">
              <button
                type="button"
                class="btn-show btn-show-secondary flex-1"
                @click="cancelConfirmation"
              >
                Cancel
              </button>
              <button type="button" class="btn-show btn-show-success flex-1" @click="confirmStart">
                Confirm
              </button>
            </footer>
          </div>
        </div>
      </Teleport>
    </div>
  </main>
</template>

<style scoped>
.setup-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.setup-header-content {
  padding: 1rem 1.5rem;
  text-align: center;
}

.setup-logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.setup-content {
  flex: 1;
  padding: 1.5rem 1rem;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section styling */
.setup-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.25rem;
}

.setup-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.setup-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  color: white;
}

.setup-section-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-brand-gold);
}

.setup-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ui-text-secondary);
}

/* Input group */
.setup-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.setup-input {
  flex: 1;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.setup-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.setup-input:focus {
  outline: none;
  border-color: var(--color-brand-cyan);
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.2);
}

.setup-add-btn {
  padding: 0.75rem 1rem;
  white-space: nowrap;
}

.setup-btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Player list */
.setup-player-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setup-player-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.setup-player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-brand-cyan) 0%, #0077b3 100%);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
  color: white;
}

.setup-player-name {
  flex: 1;
  font-weight: 500;
  color: white;
}

.setup-remove-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
}

.setup-remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.setup-remove-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.setup-hint {
  font-size: 0.875rem;
  color: var(--color-ui-text-muted);
  margin-top: 0.75rem;
}

/* Game size buttons */
.setup-size-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.setup-size-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setup-size-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.setup-size-btn-active {
  background: linear-gradient(135deg, rgba(0, 170, 255, 0.2) 0%, rgba(0, 119, 179, 0.2) 100%);
  border-color: var(--color-brand-cyan);
}

.setup-size-label {
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  color: white;
}

.setup-size-desc {
  font-size: 0.75rem;
  color: var(--color-ui-text-muted);
}

.setup-size-btn-active .setup-size-desc {
  color: var(--color-brand-cyan);
}

.setup-size-hint {
  text-align: center;
}

/* Hider selection */
.setup-random-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: var(--color-ui-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setup-random-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.setup-random-btn svg {
  width: 1rem;
  height: 1rem;
}

.setup-hider-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.setup-hider-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.setup-hider-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.setup-hider-btn-active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  border-color: var(--color-role-hider);
}

.setup-hider-avatar {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-ui-text-secondary);
  transition: all 0.2s ease;
}

.setup-hider-avatar-active {
  background: linear-gradient(135deg, var(--color-role-hider) 0%, #d97706 100%);
  color: white;
}

.setup-hider-name {
  flex: 1;
  font-weight: 500;
  color: white;
  text-align: left;
}

.setup-hider-check {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-role-hider);
}

/* Start button */
.setup-start-btn {
  width: 100%;
  padding: 1.25rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  margin-top: auto;
}

.setup-start-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* Confirmation modal */
.setup-confirm-hider {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.setup-confirm-avatar {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-role-hider) 0%, #d97706 100%);
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: white;
}

.setup-confirm-info {
  display: flex;
  flex-direction: column;
}

.setup-confirm-label {
  font-size: 0.75rem;
  color: var(--color-ui-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.setup-confirm-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-role-hider);
  letter-spacing: 0.02em;
}

.setup-confirm-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setup-confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
  color: var(--color-ui-text-secondary);
}

.setup-confirm-row:last-child {
  border-bottom: none;
}

.setup-confirm-value {
  color: white;
  font-weight: 500;
}
</style>
