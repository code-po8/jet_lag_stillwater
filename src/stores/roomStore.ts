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
}

export const useRoomStore = defineStore('room', () => {
  const persistence = createPersistenceService()

  // Injectable so tests can stub the network.
  const api = ref<RoomApi>(new RoomApi(getApiBaseUrl()))

  const code = ref<string | null>(null)
  const rejoinToken = ref<string | null>(null)
  const self = ref<PublicPlayer | null>(null)
  const players = ref<PublicPlayer[]>([])
  // Persisted role, available across a refresh before `self` is re-fetched.
  const persistedRole = ref<PublicPlayer['role'] | null>(null)

  const inRoom = computed(() => code.value !== null)
  const isHost = computed(() => self.value?.isHost ?? false)
  /** Server-assigned role: live `self` if present, else the persisted value. */
  const role = computed<PublicPlayer['role'] | null>(() => self.value?.role ?? persistedRole.value)

  function persist(): void {
    if (code.value && rejoinToken.value && self.value) {
      persistence.save<PersistedRoom>(STORAGE_KEY, {
        code: code.value,
        rejoinToken: rejoinToken.value,
        selfId: self.value.id,
        selfRole: self.value.role,
      })
    }
  }

  function hydrate(): void {
    const saved = persistence.load<PersistedRoom>(STORAGE_KEY)
    if (saved) {
      code.value = saved.code
      rejoinToken.value = saved.rejoinToken
      // self/roster are re-fetched on rejoin, but the role is restored now so
      // role-locked UI is correct immediately (older sessions may lack it).
      persistedRole.value = saved.selfRole ?? null
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
  }
})
