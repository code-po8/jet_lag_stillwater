import { describe, it, expect, vi, afterEach } from 'vitest'
import { RoomApi, RoomApiError, getApiBaseUrl, getWsUrl, isApiBaseMisconfigured } from '../roomApi'

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
}

describe('RoomApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('createRoom', () => {
    it('POSTs name and returns code + token', async () => {
      const fetchMock = mockFetch(201, {
        code: 'ABCD',
        sessionId: 's1',
        player: { id: 'p1', name: 'Host', role: 'hider', isHost: true },
        rejoinToken: 'tok',
      })
      vi.stubGlobal('fetch', fetchMock)

      const api = new RoomApi('http://api')
      const res = await api.createRoom('Host')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api/rooms',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(res.code).toBe('ABCD')
      expect(res.rejoinToken).toBe('tok')
    })

    it('throws RoomApiError on a 400', async () => {
      vi.stubGlobal('fetch', mockFetch(400, { error: 'name is required' }))
      const api = new RoomApi('http://api')
      await expect(api.createRoom('')).rejects.toBeInstanceOf(RoomApiError)
    })
  })

  describe('getRoom', () => {
    it('returns the room + roster', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetch(200, { code: 'ABCD', phase: 'setup', status: 'active', players: [] }),
      )
      const api = new RoomApi('http://api')
      const res = await api.getRoom('abcd')
      expect(res.code).toBe('ABCD')
    })

    it('throws on 404 with a notFound flag', async () => {
      vi.stubGlobal('fetch', mockFetch(404, { error: 'room not found' }))
      const api = new RoomApi('http://api')
      await expect(api.getRoom('ZZZZ')).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('joinRoom', () => {
    it('POSTs name to the join endpoint', async () => {
      const fetchMock = mockFetch(201, {
        player: { id: 'p2', name: 'Bob', role: 'seeker', isHost: false },
        rejoinToken: 'tok2',
      })
      vi.stubGlobal('fetch', fetchMock)
      const api = new RoomApi('http://api')
      const res = await api.joinRoom('ABCD', 'Bob')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api/rooms/ABCD/join',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(res.player.name).toBe('Bob')
    })
  })

  describe('rejoinRoom', () => {
    it('POSTs the rejoin token', async () => {
      const fetchMock = mockFetch(200, {
        player: { id: 'p2', name: 'Bob', role: 'seeker', isHost: false },
      })
      vi.stubGlobal('fetch', fetchMock)
      const api = new RoomApi('http://api')
      const res = await api.rejoinRoom('ABCD', 'tok2')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api/rooms/ABCD/rejoin',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(res.player.id).toBe('p2')
    })

    it('throws on 401 invalid token', async () => {
      vi.stubGlobal('fetch', mockFetch(401, { error: 'invalid rejoin token' }))
      const api = new RoomApi('http://api')
      await expect(api.rejoinRoom('ABCD', 'bad')).rejects.toMatchObject({ status: 401 })
    })
  })

  describe('base url handling', () => {
    it('trims a trailing slash from the base url', async () => {
      const fetchMock = mockFetch(200, {
        code: 'ABCD',
        phase: 'setup',
        status: 'active',
        players: [],
      })
      vi.stubGlobal('fetch', fetchMock)
      const api = new RoomApi('http://api/')
      await api.getRoom('ABCD')
      expect(fetchMock).toHaveBeenCalledWith('http://api/rooms/ABCD', expect.anything())
    })
  })

  // Guard for the VITE_API_URL misconfiguration (issue #3).
  describe('VITE_API_URL misconfiguration guard', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('is not misconfigured in dev even with no base', () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_API_URL', '')
      expect(isApiBaseMisconfigured()).toBe(false)
    })

    it('is misconfigured in a PROD build with no base', () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_API_URL', '')
      expect(isApiBaseMisconfigured()).toBe(true)
    })

    it('is fine in a PROD build when the base is set', () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_API_URL', 'https://api.example.com')
      expect(isApiBaseMisconfigured()).toBe(false)
      expect(getApiBaseUrl()).toBe('https://api.example.com')
    })

    it('a room request throws a clear error (not a same-origin fetch) when misconfigured', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_API_URL', '')
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)

      const api = new RoomApi(getApiBaseUrl())
      await expect(api.createRoom('Matthew')).rejects.toBeInstanceOf(RoomApiError)
      await expect(api.createRoom('Matthew')).rejects.toThrow(/VITE_API_URL is missing/)
      // Never fell through to a same-origin fetch.
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('getWsUrl throws in a misconfigured PROD build instead of same-origin', () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_API_URL', '')
      expect(() => getWsUrl()).toThrow(/VITE_API_URL is missing/)
    })
  })
})
