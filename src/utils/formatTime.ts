/**
 * Format milliseconds as HH:MM:SS
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((n) => n.toString().padStart(2, '0')).join(':')
}

/**
 * Format milliseconds as MM:SS if under an hour, otherwise HH:MM:SS
 */
export function formatTimeShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds].map((n) => n.toString().padStart(2, '0')).join(':')
  }

  return [minutes, seconds].map((n) => n.toString().padStart(2, '0')).join(':')
}
