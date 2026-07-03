/**
 * Host action bridge (MULTI-003b-1).
 *
 * Lets the host drive phase transitions over the wire (optimistically reflected
 * locally). The server-synced phase is mirrored into the local store by the
 * app-level `useMultiplayerBridge` (which owns phase→store + navigation), so
 * this composable is now just the outbound host-action helper — safe to use in
 * a view without owning any cross-navigation state.
 */
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync, type HostAction } from './useSync'

export function useGameSync() {
  const game = useGameStore()
  const room = useRoomStore()
  const sync = useSync()

  /**
   * Host action: optimistically reflect locally (host only) and broadcast.
   * Non-hosts calling this is a no-op (server is host-authoritative anyway).
   */
  function hostAction(action: HostAction, optimisticPhase?: GamePhase) {
    if (!room.isHost) return
    if (optimisticPhase) game.currentPhase = optimisticPhase
    sync.sendHostAction(action)
  }

  return { hostAction }
}
