import { describe, it, expect, afterEach } from 'vitest'
import { buildApp } from '../app.js'
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
})
