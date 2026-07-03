import { RoomHub } from './roomHub.js'

/**
 * Process-wide registry of live RoomHubs, keyed by room code. In-memory only —
 * this is why the API runs single-instance for v1 (see INFRA-007 notes).
 */
export class RoomHubRegistry {
  private hubs = new Map<string, RoomHub>()

  get(code: string): RoomHub | undefined {
    return this.hubs.get(code)
  }

  getOrCreate(code: string): RoomHub {
    let hub = this.hubs.get(code)
    if (!hub) {
      hub = new RoomHub(code)
      this.hubs.set(code, hub)
    }
    return hub
  }

  /** Drop a hub once its last member disconnects. */
  disposeIfEmpty(code: string): void {
    const hub = this.hubs.get(code)
    if (hub && hub.isEmpty()) this.hubs.delete(code)
  }

  size(): number {
    return this.hubs.size
  }
}
