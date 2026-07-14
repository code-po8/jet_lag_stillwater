import { ref, computed, getCurrentScope, onScopeDispose } from 'vue'

export interface UseTimerOptions {
  /** Callback function called at each tick interval */
  onTick?: (elapsed: number) => void
  /** Interval in milliseconds between tick callbacks (default: 100) */
  tickInterval?: number
  /** If true, timer counts down from initialTime instead of up */
  countdown?: boolean
  /** Initial time in milliseconds (required for countdown mode) */
  initialTime?: number
  /** Callback function called when countdown reaches zero */
  onComplete?: () => void
}

export function useTimer(options: UseTimerOptions = {}) {
  const { onTick, tickInterval = 100, countdown = false, initialTime = 0, onComplete } = options

  const elapsed = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let startTimestamp: number | null = null
  let pausedElapsed = 0

  const remaining = computed(() => {
    if (!countdown) return 0
    return Math.max(0, initialTime - elapsed.value)
  })

  /**
   * Start the timer. `fromElapsed` seeds how much time has already passed (ms) —
   * used to align a multiplayer timer to a shared server start instant, so the
   * count continues from there instead of zero.
   */
  function start(fromElapsed = 0) {
    if (isRunning.value && !isPaused.value) {
      return // Already running
    }

    if (isPaused.value) {
      // Resume from paused state
      resume()
      return
    }

    isRunning.value = true
    isPaused.value = false
    startTimestamp = Date.now()
    pausedElapsed = fromElapsed
    elapsed.value = fromElapsed

    intervalId = setInterval(() => {
      if (!isPaused.value && startTimestamp !== null) {
        elapsed.value = pausedElapsed + (Date.now() - startTimestamp)

        if (onTick) {
          onTick(elapsed.value)
        }

        // Handle countdown completion
        if (countdown && remaining.value <= 0) {
          if (onComplete) {
            onComplete()
          }
          stop()
          elapsed.value = initialTime // Ensure elapsed equals initialTime so remaining is 0
        }
      }
    }, tickInterval)
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    isRunning.value = false
    isPaused.value = false
    elapsed.value = 0
    startTimestamp = null
    pausedElapsed = 0
  }

  function pause() {
    if (!isRunning.value || isPaused.value) {
      return
    }

    isPaused.value = true
    pausedElapsed = elapsed.value
    startTimestamp = null
  }

  function resume() {
    if (!isRunning.value || !isPaused.value) {
      return
    }

    isPaused.value = false
    startTimestamp = Date.now()
  }

  function reset() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    elapsed.value = 0
    isRunning.value = false
    isPaused.value = false
    startTimestamp = null
    pausedElapsed = 0
  }

  function handleVisibilityChange(isVisible: boolean) {
    if (!isVisible || !isRunning.value || isPaused.value) {
      return
    }

    // When becoming visible again, calculate drift
    // The elapsed value should account for time passed while backgrounded
    const now = Date.now()
    if (startTimestamp !== null) {
      elapsed.value = pausedElapsed + (now - startTimestamp)
    }
  }

  // Clear the interval when the owning component/effect scope is disposed, so a
  // tick can't fire after unmount (which previously leaked past jsdom teardown
  // in the test suite — a stray tick called persist() with localStorage gone).
  // Guarded by getCurrentScope() so calling useTimer() outside a scope (unit
  // tests) doesn't warn.
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    })
  }

  return {
    elapsed,
    remaining,
    isRunning,
    isPaused,
    start,
    stop,
    pause,
    resume,
    reset,
    handleVisibilityChange,
  }
}
