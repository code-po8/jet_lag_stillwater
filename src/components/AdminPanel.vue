<script setup lang="ts">
/**
 * Host Admin panel (ADMIN-001): host-only game controls + a live roster with
 * each player's connection + GPS status.
 *
 *  - End Game early (broadcasts `end-round`; the bridge routes everyone to the
 *    round summary).
 *  - End the hiding period early (broadcasts `start-seeking`) — only shown
 *    during the hiding period.
 *  - Per-player status: WS presence (connected/disconnected) and GPS status
 *    (leak-free — driven by the server's `gps.presence`, so the hider's GPS
 *    shows even to a seeker host without revealing the hider's LOCATION).
 *
 * Starts its own geolocation watch so the HOST's own GPS status is live even if
 * they never opened the Map tab (the map owns a separate tracker).
 */
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useSync } from '@/composables/useSync'
import { useGameSync } from '@/composables/useGameSync'
import { useGeolocation } from '@/composables/useGeolocation'
import { useGameStore, GamePhase } from '@/stores/gameStore'

const sync = useSync()
const { hostAction } = useGameSync()
const geo = useGeolocation()
const gameStore = useGameStore()

// Keep the host's own GPS status live regardless of the Map tab (MAP-008 / ADMIN-001).
onMounted(() => geo.start())
onBeforeUnmount(() => geo.stop())

const players = computed(() => sync.players.value)
const selfId = computed(() => sync.self.value?.id ?? null)

const isHidingPeriod = computed(() => gameStore.currentPhase === GamePhase.HidingPeriod)
const isRoundComplete = computed(() => gameStore.currentPhase === GamePhase.RoundComplete)

/**
 * A player's GPS status. For the host itself we trust the LOCAL fix (immediate,
 * no round-trip); for everyone else the leak-free `gps.presence` set from the
 * server (the hider's coordinates are never sent to a seeker host, but their
 * presence ID is).
 */
function hasGps(playerId: string): boolean {
  if (playerId === selfId.value) return !!geo.ownPosition.value
  return sync.gpsOnline.value.has(playerId)
}

// ── Host actions ──
const canEndGame = computed(() => !isRoundComplete.value)

function endGame() {
  hostAction('end-round', GamePhase.RoundComplete)
}

// End the hiding period early — irreversible, so require a two-step confirm.
const confirmingEndHiding = ref(false)
function requestEndHiding() {
  confirmingEndHiding.value = true
}
function cancelEndHiding() {
  confirmingEndHiding.value = false
}
function confirmEndHiding() {
  confirmingEndHiding.value = false
  hostAction('start-seeking', GamePhase.Seeking)
}
</script>

<template>
  <section class="admin-panel" data-testid="admin-panel" aria-label="Host admin controls">
    <h2 class="admin-title">Host Controls</h2>

    <!-- Host actions -->
    <div class="admin-actions">
      <!-- End the hiding period early (only during the hiding period). -->
      <template v-if="isHidingPeriod">
        <button
          v-if="!confirmingEndHiding"
          type="button"
          data-testid="admin-end-hiding-btn"
          class="admin-btn admin-btn-warn"
          @click="requestEndHiding"
        >
          End Hiding Period Early
        </button>
        <div v-else class="admin-confirm" data-testid="admin-end-hiding-confirm">
          <span class="admin-confirm-text">Start seeking now for everyone?</span>
          <div class="admin-confirm-row">
            <button
              type="button"
              data-testid="admin-end-hiding-confirm-btn"
              class="admin-btn admin-btn-warn"
              @click="confirmEndHiding"
            >
              Yes, start seeking
            </button>
            <button
              type="button"
              data-testid="admin-end-hiding-cancel-btn"
              class="admin-btn admin-btn-ghost"
              @click="cancelEndHiding"
            >
              Cancel
            </button>
          </div>
        </div>
      </template>

      <!-- End the game (any non-complete phase). -->
      <button
        v-if="canEndGame"
        type="button"
        data-testid="admin-end-game-btn"
        class="admin-btn admin-btn-danger"
        @click="endGame"
      >
        End Game
      </button>
    </div>

    <!-- Player status roster -->
    <h3 class="admin-subtitle">Players</h3>
    <ul class="admin-roster" data-testid="admin-roster">
      <li
        v-for="p in players"
        :key="p.id"
        class="admin-roster-item"
        :data-testid="`admin-player-${p.id}`"
      >
        <span class="admin-player-name">
          {{ p.name }}
          <span v-if="p.id === selfId" class="admin-player-you">(you)</span>
          <span v-if="p.isHost" class="admin-badge admin-badge-host">HOST</span>
          <span v-if="p.role === 'hider'" class="admin-badge admin-badge-hider">HIDER</span>
        </span>

        <span class="admin-status">
          <!-- Connection (WS presence) -->
          <span
            class="admin-status-chip"
            :class="p.connected ? 'is-on' : 'is-off'"
            :data-testid="`admin-conn-${p.id}`"
            :title="p.connected ? 'Connected' : 'Disconnected'"
          >
            <span class="admin-status-dot" aria-hidden="true"></span>
            {{ p.connected ? 'Online' : 'Offline' }}
          </span>

          <!-- GPS status -->
          <span
            class="admin-status-chip"
            :class="hasGps(p.id) ? 'is-on' : 'is-off'"
            :data-testid="`admin-gps-${p.id}`"
            :data-gps="hasGps(p.id) ? 'on' : 'off'"
            :title="hasGps(p.id) ? 'GPS connected' : 'No GPS fix'"
          >
            <svg viewBox="0 0 24 24" class="admin-status-icon" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"
              />
            </svg>
            {{ hasGps(p.id) ? 'GPS' : 'No GPS' }}
          </span>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.admin-panel {
  padding: 1rem;
  max-width: 32rem;
  margin: 0 auto;
  color: var(--color-ui-text-primary, #f8fafc);
}
.admin-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}
.admin-subtitle {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ui-text-secondary, #94a3b8);
  margin: 1.25rem 0 0.5rem;
}
.admin-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.admin-btn {
  min-height: 48px;
  padding: 0 1rem;
  border-radius: 10px;
  border: none;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}
.admin-btn-danger {
  background: var(--color-brand-red, #c73e3e);
  color: #fff;
}
.admin-btn-warn {
  background: var(--color-brand-orange, #f07d2e);
  color: #3a1e06;
}
.admin-btn-ghost {
  background: transparent;
  border: 1px solid var(--color-ui-border, #475569);
  color: var(--color-ui-text-primary, #f8fafc);
}
.admin-confirm {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--color-brand-orange, #f07d2e);
  border-radius: 10px;
  background: rgba(240, 125, 46, 0.1);
}
.admin-confirm-text {
  font-size: 0.9rem;
  font-weight: 600;
}
.admin-confirm-row {
  display: flex;
  gap: 0.5rem;
}
.admin-confirm-row .admin-btn {
  flex: 1;
}
.admin-roster {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.admin-roster-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.6);
}
.admin-player-name {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-weight: 600;
  font-size: 0.9rem;
}
.admin-player-you {
  font-size: 0.72rem;
  color: var(--color-ui-text-secondary, #94a3b8);
  font-weight: 500;
}
.admin-badge {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid currentColor;
}
.admin-badge-host {
  color: #94a3b8;
}
.admin-badge-hider {
  color: var(--color-brand-orange, #f07d2e);
}
.admin-status {
  display: flex;
  gap: 0.4rem;
  flex: 0 0 auto;
}
.admin-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.admin-status-chip.is-on {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.5);
  background: rgba(52, 211, 153, 0.12);
}
.admin-status-chip.is-off {
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.1);
}
.admin-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.admin-status-icon {
  width: 12px;
  height: 12px;
}
</style>
