import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import GameSetupView from '../GameSetupView.vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'

// Create a mock router for testing
function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/setup', name: 'setup', component: GameSetupView },
      { path: '/game', name: 'game', component: { template: '<div>Game</div>' } },
    ],
  })
}

describe('GameSetupView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  describe('player management', () => {
    it('should display player name input', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      expect(input).toBeInTheDocument()
    })

    it('should display add player button', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const button = screen.getByRole('button', { name: /add/i })
      expect(button).toBeInTheDocument()
    })

    it('should add player when name is entered and add button clicked', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)

      expect(store.players).toHaveLength(1)
      expect(store.players[0]!.name).toBe('Alice')
    })

    it('should display added players in a list', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()

      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('should clear input after adding player', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i) as HTMLInputElement
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()

      expect(input.value).toBe('')
    })

    it('should allow removing a player', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      // Add one player only (so hider selection doesn't appear)
      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()

      expect(store.players).toHaveLength(1)

      // Remove Alice using the data-testid attribute
      const aliceId = store.players[0]!.id
      const aliceItem = screen.getByTestId(`player-${aliceId}`)
      const removeButton = within(aliceItem).getByRole('button', {
        name: /remove/i,
      })
      await fireEvent.click(removeButton)
      await nextTick()

      expect(store.players).toHaveLength(0)
    })

    it('should limit players to 4 maximum', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      // Add 4 players
      for (const name of ['Alice', 'Bob', 'Charlie', 'Diana']) {
        await fireEvent.update(input, name)
        await fireEvent.click(addButton)
      }
      await nextTick()

      expect(store.players).toHaveLength(4)

      // Try to add a 5th player - button should be disabled
      expect(addButton).toBeDisabled()
    })

    it('should require at least 2 players to start', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })
      const startButton = screen.getByRole('button', { name: /start game/i })

      // With 0 players, start should be disabled
      expect(startButton).toBeDisabled()

      // Add 1 player
      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()

      // With 1 player, still disabled (no hider section yet)
      expect(startButton).toBeDisabled()

      // Add 2nd player
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // With 2 players but no hider selected, still disabled
      expect(startButton).toBeDisabled()

      // Select a hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      // Now with 2 players and hider selected, should be enabled
      expect(startButton).not.toBeDisabled()
    })

    it('should not add empty player names', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      // Try to add empty name
      await fireEvent.update(input, '')
      await fireEvent.click(addButton)
      await nextTick()

      expect(store.players).toHaveLength(0)
    })

    it('should trim whitespace from player names', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, '  Alice  ')
      await fireEvent.click(addButton)
      await nextTick()

      expect(store.players[0]!.name).toBe('Alice')
    })
  })

  describe('game size selection', () => {
    it('should display game size options', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      expect(screen.getByText(/small/i)).toBeInTheDocument()
      expect(screen.getByText(/medium/i)).toBeInTheDocument()
      expect(screen.getByText(/large/i)).toBeInTheDocument()
    })

    it('should default to Small game size for Stillwater', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const smallOption = screen.getByTestId('game-size-small')
      expect(smallOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should allow selecting a game size', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const mediumOption = screen.getByTestId('game-size-medium')
      await fireEvent.click(mediumOption)
      await nextTick()

      expect(mediumOption).toHaveAttribute('aria-selected', 'true')

      // Small should no longer be selected
      const smallOption = screen.getByTestId('game-size-small')
      expect(smallOption).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('hider selection', () => {
    it('should display hider selection options after players are added', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // Should show hider selection section
      expect(screen.getByText(/choose.*hider/i)).toBeInTheDocument()
    })

    it('should allow selecting a player as hider', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // Click Alice as hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      expect(aliceHiderOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should have a randomize button for hider selection', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      expect(screen.getByRole('button', { name: /random/i })).toBeInTheDocument()
    })

    it('should select a random player when randomize is clicked', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      const randomButton = screen.getByRole('button', { name: /random/i })
      await fireEvent.click(randomButton)
      await nextTick()

      // One of the hider options should be selected
      const aliceOption = screen.getByTestId('hider-option-0')
      const bobOption = screen.getByTestId('hider-option-1')

      const aliceSelected = aliceOption.getAttribute('aria-selected') === 'true'
      const bobSelected = bobOption.getAttribute('aria-selected') === 'true'

      expect(aliceSelected || bobSelected).toBe(true)
    })
  })

  describe('game start', () => {
    it('should display start game button', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
    })

    it('should require a hider to be selected before starting', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })
      const startButton = screen.getByRole('button', { name: /start game/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // With 2 players but no hider selected, start should be disabled
      expect(startButton).toBeDisabled()

      // Select a hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      // Now start should be enabled
      expect(startButton).not.toBeDisabled()
    })

    it('should start game and transition to hiding-period phase after confirmation', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // Select Alice as hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      // Click start
      const startButton = screen.getByRole('button', { name: /start game/i })
      await fireEvent.click(startButton)
      await nextTick()

      // Click confirm in the modal
      const confirmButton = screen.getByRole('button', { name: /^confirm$/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      // Game should transition to hiding-period phase
      expect(store.currentPhase).toBe(GamePhase.HidingPeriod)
      expect(store.currentHider?.name).toBe('Alice')
    })

    it('should show confirmation before starting game', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // Select Alice as hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      // Click start
      const startButton = screen.getByRole('button', { name: /start game/i })
      await fireEvent.click(startButton)
      await nextTick()

      // Should show confirmation modal with the confirmation heading
      expect(screen.getByText(/confirm game start/i)).toBeInTheDocument()
      // Should show the selected hider's name in the modal
      const confirmationModal = screen
        .getByRole('heading', { name: /confirm game start/i })
        .closest('div')
      expect(confirmationModal).toBeInTheDocument()
    })

    it('should not start game if confirmation is cancelled', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // Select Alice as hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      // Click start
      const startButton = screen.getByRole('button', { name: /start game/i })
      await fireEvent.click(startButton)
      await nextTick()

      // Click cancel in confirmation
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await fireEvent.click(cancelButton)
      await nextTick()

      // Game should still be in setup phase
      expect(store.currentPhase).toBe(GamePhase.Setup)
    })

    it('should start game when confirmation is approved', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i)
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()

      // Select Alice as hider
      const aliceHiderOption = screen.getByTestId('hider-option-0')
      await fireEvent.click(aliceHiderOption)
      await nextTick()

      // Click start
      const startButton = screen.getByRole('button', { name: /start game/i })
      await fireEvent.click(startButton)
      await nextTick()

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /^confirm$/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      // Game should be in hiding-period phase
      expect(store.currentPhase).toBe(GamePhase.HidingPeriod)
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const addButton = screen.getByRole('button', { name: /add/i })
      // Button should have btn-show class which includes proper touch target sizing
      expect(addButton.className).toMatch(/btn-show/)
    })

    it('should be scrollable when content overflows', () => {
      const router = createMockRouter()
      const { container } = render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const mainContainer = container.querySelector('[data-testid="setup-container"]')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      expect(screen.getByRole('heading', { name: /game setup/i })).toBeInTheDocument()
    })

    it('should have proper form labels', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i)
      expect(input).toHaveAccessibleName()
    })
  })

  describe('player name input focus behavior (UX-005)', () => {
    it('should focus player name input after clicking Add button', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i) as HTMLInputElement
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()

      // Input should be focused after adding player
      expect(document.activeElement).toBe(input)
    })

    it('should keep focus in player name input after pressing Enter to add', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const input = screen.getByPlaceholderText(/player name/i) as HTMLInputElement

      // Focus input and type name
      input.focus()
      await fireEvent.update(input, 'Bob')
      await fireEvent.keyUp(input, { key: 'Enter' })
      await nextTick()

      // Input should still be focused after adding player via Enter
      expect(document.activeElement).toBe(input)
    })

    it('should have input focused and ready for next entry', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i) as HTMLInputElement
      const addButton = screen.getByRole('button', { name: /add/i })

      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()

      // Verify player was added and input is cleared
      expect(store.players).toHaveLength(1)
      expect(input.value).toBe('')

      // Input should be focused for the next entry
      expect(document.activeElement).toBe(input)
    })

    it('should work correctly when adding multiple players in sequence', async () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })
      const store = useGameStore()

      const input = screen.getByPlaceholderText(/player name/i) as HTMLInputElement
      const addButton = screen.getByRole('button', { name: /add/i })

      // Add first player
      await fireEvent.update(input, 'Alice')
      await fireEvent.click(addButton)
      await nextTick()
      expect(document.activeElement).toBe(input)

      // Add second player
      await fireEvent.update(input, 'Bob')
      await fireEvent.click(addButton)
      await nextTick()
      expect(document.activeElement).toBe(input)

      // Add third player
      await fireEvent.update(input, 'Charlie')
      await fireEvent.click(addButton)
      await nextTick()
      expect(document.activeElement).toBe(input)

      // Verify all players were added
      expect(store.players).toHaveLength(3)
    })
  })

  describe('logo display (BRAND-002)', () => {
    it('should render JetLagLogo component', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      expect(screen.getByTestId('jet-lag-logo')).toBeInTheDocument()
    })

    it('should position logo in header area', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const logo = screen.getByTestId('jet-lag-logo')
      // Logo should be within a header or container with appropriate positioning
      const container = logo.closest('[data-testid="setup-logo-container"]')
      expect(container).toBeInTheDocument()
    })

    it('should use appropriate size for mobile viewport', () => {
      const router = createMockRouter()
      render(GameSetupView, {
        global: {
          plugins: [router],
        },
      })

      const logo = screen.getByTestId('jet-lag-logo')
      // Small size logo has width of 120
      expect(logo).toHaveAttribute('width', '120')
    })
  })
})
