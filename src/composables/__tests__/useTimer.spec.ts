import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTimer } from '../useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should start from zero', () => {
      const { elapsed } = useTimer()

      expect(elapsed.value).toBe(0)
    })

    it('should initialize in stopped state', () => {
      const { isRunning } = useTimer()

      expect(isRunning.value).toBe(false)
    })

    it('should initialize as not paused', () => {
      const { isPaused } = useTimer()

      expect(isPaused.value).toBe(false)
    })
  })

  describe('start', () => {
    it('should set isRunning to true', () => {
      const { start, isRunning } = useTimer()

      start()

      expect(isRunning.value).toBe(true)
    })

    it('should track elapsed time', () => {
      const { start, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(1000)

      expect(elapsed.value).toBe(1000)
    })

    it('should continue tracking time over multiple seconds', () => {
      const { start, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(5000)

      expect(elapsed.value).toBe(5000)
    })

    it('should not restart if already running', () => {
      const { start, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(2000)
      start() // Try to start again
      vi.advanceTimersByTime(1000)

      expect(elapsed.value).toBe(3000)
    })
  })

  describe('stop', () => {
    it('should set isRunning to false', () => {
      const { start, stop, isRunning } = useTimer()

      start()
      stop()

      expect(isRunning.value).toBe(false)
    })

    it('should reset elapsed time to zero', () => {
      const { start, stop, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(2000)
      stop()

      expect(elapsed.value).toBe(0)
    })
  })

  describe('pause and resume', () => {
    it('should set isPaused to true when paused', () => {
      const { start, pause, isPaused } = useTimer()

      start()
      pause()

      expect(isPaused.value).toBe(true)
    })

    it('should keep isRunning true when paused', () => {
      const { start, pause, isRunning } = useTimer()

      start()
      pause()

      expect(isRunning.value).toBe(true)
    })

    it('should stop tracking time when paused', () => {
      const { start, pause, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(2000)
      pause()
      vi.advanceTimersByTime(2000)

      expect(elapsed.value).toBe(2000)
    })

    it('should resume tracking time', () => {
      const { start, pause, resume, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(2000)
      pause()
      vi.advanceTimersByTime(2000)
      resume()
      vi.advanceTimersByTime(1000)

      expect(elapsed.value).toBe(3000)
    })

    it('should set isPaused to false when resumed', () => {
      const { start, pause, resume, isPaused } = useTimer()

      start()
      pause()
      resume()

      expect(isPaused.value).toBe(false)
    })

    it('should do nothing if paused when not running', () => {
      const { pause, isPaused, isRunning } = useTimer()

      pause()

      expect(isPaused.value).toBe(false)
      expect(isRunning.value).toBe(false)
    })

    it('should do nothing if resumed when not paused', () => {
      const { start, resume, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(2000)
      resume() // Not paused, should have no effect
      vi.advanceTimersByTime(1000)

      expect(elapsed.value).toBe(3000)
    })
  })

  describe('reset', () => {
    it('should reset elapsed to zero', () => {
      const { start, reset, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(5000)
      reset()

      expect(elapsed.value).toBe(0)
    })

    it('should stop the timer', () => {
      const { start, reset, isRunning } = useTimer()

      start()
      reset()

      expect(isRunning.value).toBe(false)
    })

    it('should clear paused state', () => {
      const { start, pause, reset, isPaused } = useTimer()

      start()
      pause()
      reset()

      expect(isPaused.value).toBe(false)
    })

    it('should allow starting fresh after reset', () => {
      const { start, reset, elapsed } = useTimer()

      start()
      vi.advanceTimersByTime(5000)
      reset()
      start()
      vi.advanceTimersByTime(2000)

      expect(elapsed.value).toBe(2000)
    })
  })

  describe('tick events', () => {
    it('should emit tick events at default 100ms interval', () => {
      const onTick = vi.fn()
      const { start } = useTimer({ onTick })

      start()
      vi.advanceTimersByTime(500)

      expect(onTick).toHaveBeenCalledTimes(5)
    })

    it('should emit tick events at custom interval', () => {
      const onTick = vi.fn()
      const { start } = useTimer({ onTick, tickInterval: 1000 })

      start()
      vi.advanceTimersByTime(3000)

      expect(onTick).toHaveBeenCalledTimes(3)
    })

    it('should pass elapsed time to tick callback', () => {
      const onTick = vi.fn()
      const { start } = useTimer({ onTick, tickInterval: 1000 })

      start()
      vi.advanceTimersByTime(2000)

      expect(onTick).toHaveBeenNthCalledWith(1, 1000)
      expect(onTick).toHaveBeenNthCalledWith(2, 2000)
    })

    it('should not emit tick events when paused', () => {
      const onTick = vi.fn()
      const { start, pause } = useTimer({ onTick, tickInterval: 1000 })

      start()
      vi.advanceTimersByTime(1500)
      pause()
      vi.advanceTimersByTime(2000)

      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('should resume tick events after unpause', () => {
      const onTick = vi.fn()
      const { start, pause, resume } = useTimer({ onTick, tickInterval: 1000 })

      start()
      vi.advanceTimersByTime(1500) // 1 tick at 1000ms, elapsed = 1500ms
      pause()
      vi.advanceTimersByTime(2000) // No ticks while paused
      resume()
      vi.advanceTimersByTime(1500) // Ticks at 2000ms and 3000ms elapsed

      // Total: 3 ticks (at 1000ms, 2000ms, 3000ms elapsed)
      expect(onTick).toHaveBeenCalledTimes(3)
    })
  })

  describe('app backgrounding', () => {
    it('should handle time drift when app resumes', () => {
      const { start, elapsed, handleVisibilityChange } = useTimer()

      start()
      vi.advanceTimersByTime(2000)

      // Simulate app going to background
      const startTime = Date.now()
      vi.setSystemTime(startTime + 5000) // 5 seconds pass in background

      handleVisibilityChange(true) // App becomes visible again

      expect(elapsed.value).toBeGreaterThanOrEqual(5000)
    })

    it('should not adjust time if not running', () => {
      const { elapsed, handleVisibilityChange } = useTimer()

      const startTime = Date.now()
      vi.setSystemTime(startTime + 5000)

      handleVisibilityChange(true)

      expect(elapsed.value).toBe(0)
    })

    it('should not adjust time if paused', () => {
      const { start, pause, elapsed, handleVisibilityChange } = useTimer()

      start()
      vi.advanceTimersByTime(2000)
      pause()

      const startTime = Date.now()
      vi.setSystemTime(startTime + 5000)

      handleVisibilityChange(true)

      expect(elapsed.value).toBe(2000)
    })
  })

  describe('countdown mode', () => {
    it('should count down from initial value', () => {
      const { remaining, start } = useTimer({ countdown: true, initialTime: 30000 })

      expect(remaining.value).toBe(30000)

      start()
      vi.advanceTimersByTime(5000)

      expect(remaining.value).toBe(25000)
    })

    it('should not go below zero', () => {
      const { remaining, start } = useTimer({ countdown: true, initialTime: 5000 })

      start()
      vi.advanceTimersByTime(10000)

      expect(remaining.value).toBe(0)
    })

    it('should emit onComplete when countdown reaches zero', () => {
      const onComplete = vi.fn()
      const { start } = useTimer({ countdown: true, initialTime: 5000, onComplete })

      start()
      vi.advanceTimersByTime(5000)

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should auto-stop when countdown completes', () => {
      const { start, isRunning } = useTimer({ countdown: true, initialTime: 5000 })

      start()
      vi.advanceTimersByTime(6000)

      expect(isRunning.value).toBe(false)
    })

    it('should reset countdown to initial value on reset', () => {
      const { start, reset, remaining } = useTimer({ countdown: true, initialTime: 30000 })

      start()
      vi.advanceTimersByTime(10000)
      reset()

      expect(remaining.value).toBe(30000)
    })
  })

  describe('cleanup', () => {
    it('should clear interval on stop', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      const { start, stop } = useTimer()

      start()
      stop()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})
