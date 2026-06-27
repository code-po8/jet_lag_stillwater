import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import pg from 'pg'
import { buildApp } from '../../app.js'
import type { FastifyInstance } from 'fastify'

// Integration tests that need a real Postgres. Run via the `itest-server`
// compose service (which sets DATABASE_URL and can reach the postgres service).
// Skipped automatically when DATABASE_URL is absent (e.g. the offline unit run).
const DATABASE_URL = process.env.DATABASE_URL
const d = DATABASE_URL ? describe : describe.skip

d('room routes (integration)', () => {
  let pool: pg.Pool
  let app: FastifyInstance

  beforeAll(() => {
    pool = new pg.Pool({ connectionString: DATABASE_URL })
  })

  afterAll(async () => {
    await app?.close()
    await pool.end()
  })

  beforeEach(async () => {
    await pool.query('TRUNCATE players, sessions CASCADE')
    app = buildApp({ logger: false, db: pool })
    await app.ready()
  })

  async function createRoom(name = 'Host') {
    const res = await app.inject({ method: 'POST', url: '/rooms', payload: { name } })
    return { res, body: res.json() }
  }

  describe('POST /rooms', () => {
    it('creates a room and returns a code + rejoin token', async () => {
      const { res, body } = await createRoom()
      expect(res.statusCode).toBe(201)
      expect(body.code).toMatch(/^[A-Z2-9]{4}$/)
      expect(body.rejoinToken).toMatch(/^[0-9a-f]{64}$/)
      expect(body.player).toMatchObject({ name: 'Host', isHost: true })
    })

    it('requires a name', async () => {
      const res = await app.inject({ method: 'POST', url: '/rooms', payload: {} })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /rooms/:code', () => {
    it('returns the room and roster', async () => {
      const { body } = await createRoom('Alice')
      const res = await app.inject({ method: 'GET', url: `/rooms/${body.code}` })
      expect(res.statusCode).toBe(200)
      expect(res.json().players).toHaveLength(1)
    })

    it('is case-insensitive on the code', async () => {
      const { body } = await createRoom()
      const res = await app.inject({ method: 'GET', url: `/rooms/${body.code.toLowerCase()}` })
      expect(res.statusCode).toBe(200)
    })

    it('404s an unknown room', async () => {
      const res = await app.inject({ method: 'GET', url: '/rooms/ZZZZ' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /rooms/:code/join', () => {
    it('adds a seeker and returns their rejoin token', async () => {
      const { body } = await createRoom()
      const res = await app.inject({
        method: 'POST',
        url: `/rooms/${body.code}/join`,
        payload: { name: 'Bob' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().player).toMatchObject({ name: 'Bob', isHost: false, role: 'seeker' })
      expect(res.json().rejoinToken).toMatch(/^[0-9a-f]{64}$/)
    })

    it('404s joining an unknown room', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/rooms/ZZZZ/join',
        payload: { name: 'Bob' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /rooms/:code/rejoin', () => {
    it('re-attaches a player with a valid token', async () => {
      const { body } = await createRoom()
      const join = await app.inject({
        method: 'POST',
        url: `/rooms/${body.code}/join`,
        payload: { name: 'Bob' },
      })
      const token = join.json().rejoinToken

      const res = await app.inject({
        method: 'POST',
        url: `/rooms/${body.code}/rejoin`,
        payload: { rejoinToken: token },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().player).toMatchObject({ name: 'Bob' })
    })

    it('401s an invalid token', async () => {
      const { body } = await createRoom()
      const res = await app.inject({
        method: 'POST',
        url: `/rooms/${body.code}/rejoin`,
        payload: { rejoinToken: 'deadbeef'.repeat(8) },
      })
      expect(res.statusCode).toBe(401)
    })
  })
})
