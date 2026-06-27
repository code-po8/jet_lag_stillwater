-- Up Migration
-- Initial schema for room/session sync (INFRA-004).
-- See STORIES.md MULTI-001 design outcome for the data model rationale.

-- Sessions = rooms. `state` holds the synced game snapshot (JSONB); positions
-- are NOT stored here (they live in the in-memory RoomHub).
CREATE TABLE sessions (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text         NOT NULL,
  phase         text         NOT NULL DEFAULT 'setup',
  status        text         NOT NULL DEFAULT 'active',
  state         jsonb        NOT NULL DEFAULT '{}'::jsonb,
  state_version integer      NOT NULL DEFAULT 0,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  expires_at    timestamptz  NOT NULL
);

-- Codes recycle: a code must be unique only among rooms that are NOT ended,
-- so a finished room's code can be handed out again. Partial unique index.
CREATE UNIQUE INDEX sessions_active_code_unique
  ON sessions (code)
  WHERE status <> 'ended';

-- Sweeper queries expired rooms by expires_at.
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- Players in a room. rejoin_token_hash is the SHA-256 of the raw token
-- (raw token returned to the client once, never stored).
CREATE TABLE players (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid         NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  name              text         NOT NULL,
  role              text         NOT NULL DEFAULT 'seeker',
  is_host           boolean      NOT NULL DEFAULT false,
  rejoin_token_hash text         NOT NULL,
  connected         boolean      NOT NULL DEFAULT false,
  joined_at         timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX players_session_id_idx ON players (session_id);

-- One host per room.
CREATE UNIQUE INDEX players_one_host_per_session
  ON players (session_id)
  WHERE is_host;

-- Down Migration
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS sessions;
