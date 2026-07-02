/**
 * Re-export of the shared sync protocol DTOs for use across the Vue client.
 *
 * The single source of truth lives in the `@shared` package (INFRA-008) so the
 * client and server can never drift. SYNC-001 builds the SyncService on top of
 * these types.
 */
export type {
  Role,
  GamePhase,
  Position,
  PublicPlayer,
  Zone,
  ClientMessage,
  ServerMessage,
  SyncedState,
  GameEventKind,
  GameEventMessage,
  GameEventRelay,
} from '@jet-lag-stillwater/shared'

export {
  QUARTER_MILE_M,
  isClientMessageType,
  isServerMessageType,
  computeClockOffset,
} from '@jet-lag-stillwater/shared'
