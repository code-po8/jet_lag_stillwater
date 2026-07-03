/**
 * Room/session store (MULTI-002).
 *
 * Holds the current multiplayer room: code, roster, this device's player, and
 * its rejoin token. The rejoin token + code are persisted (via the existing
 * persistence service) so a refresh or dropped connection can rejoin. When no
 * room is joined the app is fully offline (single-device) as before.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createPersistenceService } from '@/services/persistence'
import { RoomApi, getApiBaseUrl } from '@/services/sync/roomApi'
import type { PublicPlayer } from '@/services/sync/protocol'

const STORAGE_KEY = 'room-session'

interface PersistedRoom {
  code: string
  rejoinToken: string
  selfId: string
  /**
   * The server-assigned role, persisted so a refresh knows it IMMEDIATELY —
   * before the WS `welcome` re-establishes `self`. Without this the role-locked
   * gameplay UI strands the player on the wrong (default) role until/unless a
   * welcome arrives (and forever if offline).
   */
  selfRole: PublicPlayer['role']
  /**
   * Whether this device is the host, persisted for the same reason as the role:
   * a mid-game refresh must know it's the host BEFORE `welcome` arrives, or the
   * host loses its host-only controls (pause/resume, end game). `isHost` derives
   * from live `self` when present, else this persisted value.
   */
  selfIsHost: boolean
}

export const useRoomStore = defineStore('room', () => {
  const persistence = createPersistenceService()

  // Injectable so tests can stub the network.
  const api = ref<RoomApi>(new RoomApi(getApiBaseUrl()))

  const code = ref<string | null>(null)
  const rejoinToken = ref<string | null>(null)
  const self = ref<PublicPlayer | null>(null)
  const players = ref<PublicPlayer[]>([])
  // Persisted role/host flag, available across a refresh before `self` is
  // re-fetched (the WS welcome).
  const persistedRole = ref<PublicPlayer['role'] | null>(null)
  const persistedIsHost = ref(false)

  const inRoom = computed(() => code.value !== null)
  /** Host status: live `self` if present, else the persisted value (post-refresh). */
  const isHost = computed(() => self.value?.isHost ?? persistedIsHost.value)
  /** Server-assigned role: live `self` if present, else the persisted value. */
  const role = computed<PublicPlayer['role'] | null>(() => self.value?.role ?? persistedRole.value)

  function persist(): void {
    if (code.value && rejoinToken.value && self.value) {
      persistence.save<PersistedRoom>(STORAGE_KEY, {
        code: code.value,
        rejoinToken: rejoinToken.value,
        selfId: self.value.id,
        selfRole: self.value.role,
        selfIsHost: self.value.isHost,
      })
    }
  }

  function hydrate(): void {
    const saved = persistence.load<PersistedRoom>(STORAGE_KEY)
    if (saved) {
      code.value = saved.code
      rejoinToken.value = saved.rejoinToken
      // self/roster are re-fetched on rejoin, but the role + host flag are
      // restored now so role/host-locked UI is correct immediately (older
      // sessions may lack these fields → default role null, host false).
      persistedRole.value = saved.selfRole ?? null
      persistedIsHost.value = saved.selfIsHost ?? false
    }
  }

  async function createRoom(name: string): Promise<void> {
    const res = await api.value.createRoom(name)
    code.value = res.code
    self.value = res.player
    rejoinToken.value = res.rejoinToken
    players.value = [res.player]
    persist()
  }

  async function joinRoom(roomCode: string, name: string): Promise<void> {
    const res = await api.value.joinRoom(roomCode, name)
    code.value = roomCode.toUpperCase()
    self.value = res.player
    rejoinToken.value = res.rejoinToken
    await refreshRoster()
    persist()
  }

  /**
   * Adopt the authoritative `self` from the WS welcome (fired on connect AND on
   * every reconnect). After a mid-game refresh `self` is null until this lands,
   * so mirroring it here restores live host status / role — and re-persists them
   * so a subsequent refresh is correct before the next welcome. The bridge calls
   * this; keeping it in the store means `isHost`/`role` have a single source.
   */
  function applySyncedSelf(player: PublicPlayer): void {
    self.value = player
    persistedRole.value = player.role
    persistedIsHost.value = player.isHost
    persist()
  }

  async function rejoin(): Promise<boolean> {
    if (!code.value || !rejoinToken.value) return false
    const res = await api.value.rejoinRoom(code.value, rejoinToken.value)
    self.value = res.player
    await refreshRoster()
    return true
  }

  async function refreshRoster(): Promise<void> {
    if (!code.value) return
    const info = await api.value.getRoom(code.value)
    players.value = info.players
  }

  function leaveRoom(): void {
    code.value = null
    rejoinToken.value = null
    self.value = null
    players.value = []
    persistence.remove(STORAGE_KEY)
  }

  hydrate()

  return {
    api,
    code,
    rejoinToken,
    self,
    players,
    inRoom,
    isHost,
    role,
    createRoom,
    joinRoom,
    rejoin,
    refreshRoster,
    leaveRoom,
    applySyncedSelf,
  }
})
