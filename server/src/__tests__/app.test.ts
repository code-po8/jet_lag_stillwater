import { describe, it, expect, afterEach } from 'vitest'
import { buildApp, parseWebOrigins } from '../app.js'
import type { FastifyInstance } from 'fastify'

describe('backend app', () => {
  let app: FastifyInstance | undefined

  afterEach(async () => {
    if (app) {
      await app.close()
      app = undefined
    }
  })

  it('builds a Fastify instance', async () => {
    app = buildApp()
    await app.ready()
    expect(app).toBeDefined()
    expect(typeof app.inject).toBe('function')
  })

  describe('GET /health', () => {
    it('returns 200', async () => {
      app = buildApp()
      const res = await app.inject({ method: 'GET', url: '/health' })
      expect(res.statusCode).toBe(200)
    })

    it('returns ok status as JSON', async () => {
      app = buildApp()
      const res = await app.inject({ method: 'GET', url: '/health' })
      expect(res.headers['content-type']).toContain('application/json')
      const body = res.json()
      expect(body).toMatchObject({ status: 'ok' })
    })

    it('reports uptime and a timestamp', async () => {
      app = buildApp()
      const res = await app.inject({ method: 'GET', url: '/health' })
      const body = res.json()
      expect(typeof body.uptime).toBe('number')
      expect(typeof body.timestamp).toBe('string')
    })
  })

  describe('unknown routes', () => {
    it('returns 404 for an unknown path', async () => {
      app = buildApp()
      const res = await app.inject({ method: 'GET', url: '/does-not-exist' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('logging option', () => {
    it('accepts a logger flag without throwing', async () => {
      app = buildApp({ logger: false })
      await app.ready()
      expect(app).toBeDefined()
    })
  })

  describe('CORS (INFRA-007)', () => {
    it('reflects the allowed web origin when locked', async () => {
      app = buildApp({ logger: false, webOrigin: 'https://web.example.com' })
      const res = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { origin: 'https://web.example.com' },
      })
      expect(res.headers['access-control-allow-origin']).toBe('https://web.example.com')
    })

    it('does not reflect a disallowed origin', async () => {
      app = buildApp({ logger: false, webOrigin: 'https://web.example.com' })
      const res = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { origin: 'https://evil.example.com' },
      })
      expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com')
    })

    it('allows any origin in a comma-separated WEB_ORIGIN list', async () => {
      app = buildApp({
        logger: false,
        webOrigin: 'https://web.example.com, https://custom.example.com',
      })
      for (const origin of ['https://web.example.com', 'https://custom.example.com']) {
        const res = await app.inject({ method: 'GET', url: '/health', headers: { origin } })
        expect(res.headers['access-control-allow-origin']).toBe(origin)
      }
    })

    it('still rejects an origin not in the list', async () => {
      app = buildApp({
        logger: false,
        webOrigin: 'https://web.example.com, https://custom.example.com',
      })
      const res = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { origin: 'https://evil.example.com' },
      })
      expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com')
    })
  })

  describe('parseWebOrigins', () => {
    it('returns an empty array for undefined or empty input', () => {
      expect(parseWebOrigins(undefined)).toEqual([])
      expect(parseWebOrigins('')).toEqual([])
      expect(parseWebOrigins('  ')).toEqual([])
    })

    it('parses a single origin', () => {
      expect(parseWebOrigins('https://a.example.com')).toEqual(['https://a.example.com'])
    })

    it('splits, trims, and drops empty entries from a list', () => {
      expect(parseWebOrigins('https://a.example.com, https://b.example.com,')).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })
  })
})
