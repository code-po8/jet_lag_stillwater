/**
 * App-level multiplayer bridge.
 *
 * Mounted once in App.vue (which never unmounts), so it keeps working across
 * navigation — unlike view-scoped composables. It connects the multiplayer
 * transport to the local game state and router:
 *
 *  1. Roster → gameStore: mirrors the synced roster (names + roles) into
 *     gameStore.players / currentHiderId, so the game views render real players.
 *  2. Phase → gameStore + navigation: mirrors the server-synced phase locally
 *     and routes EVERY client (host and joiners alike) on the key transitions —
 *     start (→ /game) and end (→ /results) — so a non-host isn't left behind.
 *
 * Offline (no room) it does nothing; single-device play is unaffected.
 */
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync } from './useSync'
import { getWsUrl } from '@/services/sync/roomApi'
import type { GamePhase as WirePhase } from '@/services/sync/protocol'

/** Wire phase strings equal the GamePhase enum values (validated by the union). */
function toGamePhase(p: WirePhase): GamePhase {
  return p as GamePhase
}

export function useMultiplayerBridge() {
  const game = useGameStore()
  const room = useRoomStore()
  const sync = useSync()
  const route = useRoute()
  const router = useRouter()
  const { inRoom } = storeToRefs(room)

  // 0. Reconnect the realtime transport whenever we have a persisted room but
  // aren't connected — e.g. after a mid-game page refresh. Previously connect()
  // was only called from the lobby, so refreshing in the game left the device
  // silently offline (roster/pause/phase stopped syncing). The server replies
  // with a fresh `welcome` (full roster + phase) on reconnect.
  let reconnecting = false
  async function ensureConnected() {
    if (reconnecting) return
    if (!room.code || !room.rejoinToken) return
    if (sync.status.value === 'connected' || sync.status.value === 'connecting') return
    reconnecting = true
    try {
      await sync.connect({ url: getWsUrl(), code: room.code, rejoinToken: room.rejoinToken })
    } catch {
      // Transient; the watcher below retries when inRoom/status settle.
    } finally {
      reconnecting = false
    }
  }
  const stopReconnect = watch(
    [inRoom, sync.status],
    () => {
      if (inRoom.value && sync.status.value === 'disconnected') void ensureConnected()
    },
    { immediate: true },
  )

  // 0b. Synced self → roomStore. The WS `welcome` (on connect AND every
  // reconnect) is the authoritative source for THIS device's identity — id,
  // role, and crucially `isHost`. After a mid-game refresh roomStore.self is
  // null until this lands, so mirroring it restores host-only controls
  // (pause/resume, end game) that would otherwise stay disabled. Skip null
  // (pre-welcome) so we never clobber the persisted host/role fallback.
  const stopSelf = watch(
    () => sync.self.value,
    (self) => {
      if (!inRoom.value || !self) return
      room.applySyncedSelf(self)
    },
    { immediate: true },
  )

  // 1. Roster → gameStore. New array identity on each roster update is enough;
  // syncFromRoster merges by id so stats survive. Skip an EMPTY roster: before
  // the (re)connect `welcome` arrives, sync.players is [] — bridging that would
  // wipe the players (e.g. names vanish on a mid-game refresh). A real room
  // always has ≥1 member, so [] only ever means "not synced yet".
  const stopRoster = watch(
    () => sync.players.value,
    (players) => {
      if (!inRoom.value || players.length === 0) return
      game.syncFromRoster(players.map((p) => ({ id: p.id, name: p.name, role: p.role })))
    },
    { immediate: true },
  )

  // 2. Phase → gameStore + navigation.
  const stopPhase = watch(
    () => sync.phase.value,
    (wirePhase) => {
      if (!inRoom.value || !wirePhase) return
      const next = toGamePhase(wirePhase)
      if (game.currentPhase !== next) game.currentPhase = next

      // Route all clients on the start/end edges. Guard on the current route so
      // we only push once and don't fight manual navigation.
      if (next === GamePhase.HidingPeriod && route.name === 'lobby') {
        router.push('/game')
      } else if (next === GamePhase.RoundComplete && route.name === 'game') {
        router.push('/results')
      }
    },
    { immediate: true },
  )

  // 3. Paused → gameStore. The host's pause/resume is broadcast by the server
  // as `paused`; apply it locally so every device stops/starts its timers (the
  // store actions are guarded, so this is a no-op on the device that initiated).
  const stopPaused = watch(
    () => sync.paused.value,
    (paused) => {
      if (!inRoom.value) return
      if (paused && !game.isGamePaused) game.pauseGame()
      else if (!paused && game.isGamePaused) game.resumeGame()
    },
  )

  return {
    stopMultiplayerBridge: () => {
      stopReconnect()
      stopSelf()
      stopRoster()
      stopPhase()
      stopPaused()
    },
  }
}
