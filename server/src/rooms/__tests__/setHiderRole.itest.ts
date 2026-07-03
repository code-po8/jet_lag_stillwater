import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import pg from 'pg'
import { createRoom, joinRoom, listPlayers, setHiderRole } from '../repository.js'

// Integration test (real Postgres) for the durable hider-role assignment that
// backs reconnect: without persisting the role, a reconnecting hider is read
// back from the DB as a seeker. Run via the `itest-server` compose service.
const DATABASE_URL = process.env.DATABASE_URL
const d = DATABASE_URL ? describe : describe.skip

d('setHiderRole (integration)', () => {
  let pool: pg.Pool

  beforeAll(() => {
    pool = new pg.Pool({ connectionString: DATABASE_URL })
  })
  afterAll(async () => {
    await pool.end()
  })
  beforeEach(async () => {
    await pool.query('TRUNCATE players, sessions CASCADE')
  })

  it('promotes the chosen player to hider and demotes everyone else', async () => {
    const room = await createRoom(pool, { hostName: 'Hank' })
    const joined = await joinRoom(pool, { code: room.session.code, name: 'Sam' })
    if ('error' in joined) throw new Error('join failed')

    // Everyone starts as a seeker.
    const before = await listPlayers(pool, room.session.id)
    expect(before.every((p) => p.role === 'seeker')).toBe(true)

    await setHiderRole(pool, { code: room.session.code, hiderId: joined.player.id })

    const after = await listPlayers(pool, room.session.id)
    const sam = after.find((p) => p.id === joined.player.id)
    const hank = after.find((p) => p.id === room.player.id)
    expect(sam?.role).toBe('hider')
    expect(hank?.role).toBe('seeker')
    expect(after.filter((p) => p.role === 'hider')).toHaveLength(1)
  })

  it('reassigns the hider (single hider invariant) on a second call', async () => {
    const room = await createRoom(pool, { hostName: 'Hank' })
    const sam = await joinRoom(pool, { code: room.session.code, name: 'Sam' })
    if ('error' in sam) throw new Error('join failed')

    await setHiderRole(pool, { code: room.session.code, hiderId: sam.player.id })
    // Host picks itself instead → Sam must drop back to seeker.
    await setHiderRole(pool, { code: room.session.code, hiderId: room.player.id })

    const after = await listPlayers(pool, room.session.id)
    expect(after.find((p) => p.id === room.player.id)?.role).toBe('hider')
    expect(after.find((p) => p.id === sam.player.id)?.role).toBe('seeker')
    expect(after.filter((p) => p.role === 'hider')).toHaveLength(1)
  })

  it('is a no-op for an unknown room code', async () => {
    await expect(setHiderRole(pool, { code: 'ZZZZ', hiderId: 'nope' })).resolves.toBeUndefined()
  })
})
