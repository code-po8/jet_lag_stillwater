import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import CounterButton from '../CounterButton.vue'

describe('CounterButton', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render with initial count of 0', () => {
    render(CounterButton)
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
  })

  it('should find button by text', () => {
    render(CounterButton)
    expect(screen.getByRole('button', { name: /increment/i })).toBeInTheDocument()
  })

  it('should increment count when button is clicked', async () => {
    const user = userEvent.setup()
    render(CounterButton)

    const button = screen.getByRole('button', { name: /increment/i })
    await user.click(button)

    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })

  it('should increment count multiple times', async () => {
    const user = userEvent.setup()
    render(CounterButton)

    const button = screen.getByRole('button', { name: /increment/i })
    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(screen.getByText('Count: 3')).toBeInTheDocument()
  })
})
