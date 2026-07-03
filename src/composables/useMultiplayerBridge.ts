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

  // 1. Roster → gameStore. New array identity on each roster update is enough;
  // syncFromRoster merges by id so stats survive.
  const stopRoster = watch(
    () => sync.players.value,
    (players) => {
      if (!inRoom.value) return
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

  return {
    stopMultiplayerBridge: () => {
      stopRoster()
      stopPhase()
    },
  }
}
