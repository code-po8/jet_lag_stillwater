/**
 * Game-state sync bridge (MULTI-003b-1).
 *
 * When in a multiplayer room, mirrors the server-synced phase into the local
 * gameStore so every device shows the same phase, and lets the host drive phase
 * transitions over the wire. Offline (no room) the gameStore drives phase
 * locally as before.
 */
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync, type HostAction } from './useSync'
import type { GamePhase as WirePhase } from '@/services/sync/protocol'

/** The wire phase strings equal the GamePhase enum values, so this is a cast. */
function toGamePhase(p: WirePhase): GamePhase {
  return p as GamePhase
}

export function useGameSync() {
  const game = useGameStore()
  const room = useRoomStore()
  const sync = useSync()
  const { inRoom } = storeToRefs(room)

  // Apply the server-synced phase to the local store while in a room.
  const stop = watch(
    () => sync.phase.value,
    (wirePhase) => {
      if (inRoom.value && wirePhase) {
        const next = toGamePhase(wirePhase)
        if (game.currentPhase !== next) {
          game.currentPhase = next
        }
      }
    },
    { immediate: true },
  )

  /**
   * Host action: optimistically reflect locally (host only) and broadcast.
   * Non-hosts calling this is a no-op (server is host-authoritative anyway).
   */
  function hostAction(action: HostAction, optimisticPhase?: GamePhase) {
    if (!room.isHost) return
    if (optimisticPhase) game.currentPhase = optimisticPhase
    sync.sendHostAction(action)
  }

  return { hostAction, stopGameSync: stop }
}
