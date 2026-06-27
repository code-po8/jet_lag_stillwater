<script setup lang="ts">
/**
 * Multiplayer lobby (MULTI-002): create or join a room, share the code, see the
 * roster, and (host) start the game. The room/session lives in roomStore; the
 * realtime connection (SyncService) is wired in SYNC-002.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/roomStore'

const router = useRouter()
const room = useRoomStore()

const hostName = ref('')
const joinCode = ref('')
const joinName = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function createRoom() {
  error.value = null
  if (!hostName.value.trim()) {
    error.value = 'Enter your name to host.'
    return
  }
  busy.value = true
  try {
    await room.createRoom(hostName.value.trim())
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not create room.'
  } finally {
    busy.value = false
  }
}

async function joinRoom() {
  error.value = null
  if (!joinCode.value.trim() || !joinName.value.trim()) {
    error.value = 'Enter a room code and your name.'
    return
  }
  busy.value = true
  try {
    await room.joinRoom(joinCode.value.trim(), joinName.value.trim())
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not join room.'
  } finally {
    busy.value = false
  }
}

function startGame() {
  // Phase/start wiring lands with the sync stories; for now enter the game view.
  router.push('/game')
}

function leave() {
  room.leaveRoom()
  error.value = null
}
</script>

<template>
  <main class="lobby">
    <h1 class="lobby-title">Multiplayer Lobby</h1>

    <p v-if="error" data-testid="lobby-error" class="lobby-error" role="alert">{{ error }}</p>

    <!-- Pre-room: create or join -->
    <section v-if="!room.inRoom" class="lobby-actions">
      <div class="lobby-card">
        <h2 class="lobby-card-title">Host a game</h2>
        <label class="lobby-label" for="host-name">Your name</label>
        <input
          id="host-name"
          data-testid="host-name-input"
          v-model="hostName"
          class="lobby-input"
          type="text"
          autocomplete="off"
          @keyup.enter="createRoom"
        />
        <button
          data-testid="create-room-btn"
          class="lobby-btn lobby-btn-primary"
          :disabled="busy"
          @click="createRoom"
        >
          Create Room
        </button>
      </div>

      <form data-testid="join-room-form" class="lobby-card" @submit.prevent="joinRoom">
        <h2 class="lobby-card-title">Join a game</h2>
        <label class="lobby-label" for="join-code">Room code</label>
        <input
          id="join-code"
          data-testid="join-code-input"
          v-model="joinCode"
          class="lobby-input lobby-input-code"
          type="text"
          maxlength="8"
          autocapitalize="characters"
          autocomplete="off"
        />
        <label class="lobby-label" for="join-name">Your name</label>
        <input
          id="join-name"
          data-testid="join-name-input"
          v-model="joinName"
          class="lobby-input"
          type="text"
          autocomplete="off"
        />
        <button
          data-testid="join-submit-btn"
          class="lobby-btn lobby-btn-primary"
          type="submit"
          :disabled="busy"
        >
          Join Room
        </button>
      </form>
    </section>

    <!-- In-room: code + roster -->
    <section v-else class="lobby-room">
      <p class="lobby-code-label">Room code</p>
      <p data-testid="room-code-display" class="lobby-code">{{ room.code }}</p>
      <p class="lobby-code-hint">Share this code so others can join.</p>

      <h2 class="lobby-card-title">Players</h2>
      <ul data-testid="lobby-roster" class="lobby-roster">
        <li v-for="p in room.players" :key="p.id" class="lobby-roster-item">
          <span class="lobby-roster-name">{{ p.name }}</span>
          <span v-if="p.isHost" class="lobby-roster-badge">HOST</span>
        </li>
      </ul>

      <button
        v-if="room.isHost"
        data-testid="start-game-btn"
        class="lobby-btn lobby-btn-primary"
        @click="startGame"
      >
        Start Game
      </button>
      <button data-testid="leave-room-btn" class="lobby-btn lobby-btn-ghost" @click="leave">
        Leave Room
      </button>
    </section>
  </main>
</template>

<style scoped>
.lobby {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  color: var(--color-ui-text-primary, #f8fafc);
}
.lobby-title {
  font-family: 'Bebas Neue', Impact, sans-serif;
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}
.lobby-error {
  background: rgba(199, 62, 62, 0.18);
  border: 1px solid #c73e3e;
  color: #ffb4b4;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.lobby-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.lobby-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-ui-surface, #1e293b);
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 12px;
  padding: 1rem;
}
.lobby-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}
.lobby-label {
  font-size: 0.8rem;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.lobby-input {
  min-height: 44px;
  border-radius: 8px;
  border: 1px solid var(--color-ui-border, #475569);
  background: var(--color-ui-bg, #0f172a);
  color: inherit;
  padding: 0 0.75rem;
  font-size: 1rem;
}
.lobby-input-code {
  text-transform: uppercase;
  letter-spacing: 0.3em;
  font-family: 'Bebas Neue', monospace;
  font-size: 1.4rem;
  text-align: center;
}
.lobby-btn {
  min-height: 44px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}
.lobby-btn-primary {
  background: var(--color-brand-cyan, #00aaff);
  color: #04263a;
}
.lobby-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.lobby-btn-ghost {
  background: transparent;
  border: 1px solid var(--color-ui-border, #475569);
  color: var(--color-ui-text-secondary, #94a3b8);
  margin-top: 0.5rem;
}
.lobby-room {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}
.lobby-code-label {
  font-size: 0.8rem;
  color: var(--color-ui-text-secondary, #94a3b8);
  margin: 0;
}
.lobby-code {
  font-family: 'Bebas Neue', monospace;
  font-size: 3rem;
  letter-spacing: 0.3em;
  color: var(--color-brand-gold, #f5b830);
  margin: 0;
}
.lobby-code-hint {
  font-size: 0.85rem;
  color: var(--color-ui-text-secondary, #94a3b8);
  margin: 0 0 1rem;
}
.lobby-roster {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.lobby-roster-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-ui-surface, #1e293b);
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
}
.lobby-roster-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-brand-gold, #f5b830);
  border: 1px solid var(--color-brand-gold, #f5b830);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
}
</style>
