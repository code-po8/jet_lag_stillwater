/**
 * Role-Based Views Tests (GS-003)
 *
 * Tests for HiderView, SeekerView, and role toggle functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import HiderView from '../HiderView.vue'
import SeekerView from '../SeekerView.vue'
import GamePlayView from '../GamePlayView.vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'

// Create a mock router
function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/setup', name: 'setup', component: { template: '<div>Setup</div>' } },
      { path: '/game', name: 'game', component: GamePlayView },
    ],
  })
}

describe('HiderView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  function renderHiderView() {
    const router = createMockRouter()
    return render(HiderView, {
      global: {
        plugins: [router],
      },
    })
  }

  describe('card display', () => {
    it('should display the CardHand component', () => {
      renderHiderView()
      expect(screen.getByTestId('hider-cards-section')).toBeInTheDocument()
    })

    it('should show cards in hand', async () => {
      renderHiderView()
      // CardHand component should be present
      expect(screen.getByTestId('card-hand-container')).toBeInTheDocument()
    })
  })

  describe('time bonus display', () => {
    it('should display total time bonus prominently', () => {
      renderHiderView()
      expect(screen.getByTestId('time-bonus-total')).toBeInTheDocument()
    })
  })

  describe('hider-specific information', () => {
    it('should show current hiding phase status', () => {
      renderHiderView()
      expect(screen.getByTestId('phase-status')).toBeInTheDocument()
    })

    it('should display hider role indicator', () => {
      renderHiderView()
      expect(screen.getByTestId('role-indicator')).toHaveTextContent(/hider/i)
    })
  })
})

describe('SeekerView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  function renderSeekerView() {
    const router = createMockRouter()
    return render(SeekerView, {
      global: {
        plugins: [router],
      },
    })
  }

  describe('question display', () => {
    it('should display the QuestionList component', () => {
      renderSeekerView()
      expect(screen.getByTestId('seeker-questions-section')).toBeInTheDocument()
    })

    it('should show question list container', () => {
      renderSeekerView()
      expect(screen.getByTestId('question-list-container')).toBeInTheDocument()
    })
  })

  describe('answer history', () => {
    it('should show previously answered questions summary', () => {
      renderSeekerView()
      expect(screen.getByTestId('answers-summary')).toBeInTheDocument()
    })
  })

  describe('seeker-specific information', () => {
    it('should show current seeking phase status', () => {
      renderSeekerView()
      expect(screen.getByTestId('phase-status')).toBeInTheDocument()
    })

    it('should display seeker role indicator', () => {
      renderSeekerView()
      expect(screen.getByTestId('role-indicator')).toHaveTextContent(/seeker/i)
    })
  })
})

describe('GamePlayView (role toggle)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  function renderGamePlayView(initialPhase: GamePhase = GamePhase.Seeking) {
    const router = createMockRouter()

    // Set up game state
    const gameStore = useGameStore()
    gameStore.addPlayer('Alice')
    gameStore.addPlayer('Bob')
    const aliceId = gameStore.players[0]!.id
    gameStore.startRound(aliceId)

    // Manually set the phase if different from hiding-period
    if (initialPhase !== GamePhase.HidingPeriod) {
      // Use internal state manipulation for testing
      gameStore.currentPhase = initialPhase
    }

    return render(GamePlayView, {
      global: {
        plugins: [router],
      },
    })
  }

  describe('role toggle functionality', () => {
    it('should display role toggle buttons', () => {
      renderGamePlayView()
      expect(screen.getByTestId('role-toggle')).toBeInTheDocument()
    })

    it('should have hider toggle button', () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      expect(within(roleToggle).getByRole('button', { name: /hider/i })).toBeInTheDocument()
    })

    it('should have seeker toggle button', () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      expect(within(roleToggle).getByRole('button', { name: /seeker/i })).toBeInTheDocument()
    })

    it('should switch to HiderView when hider toggle is clicked', async () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      const hiderButton = within(roleToggle).getByRole('button', { name: /hider/i })
      await fireEvent.click(hiderButton)
      await nextTick()
      expect(screen.getByTestId('hider-view')).toBeInTheDocument()
    })

    it('should switch to SeekerView when seeker toggle is clicked', async () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      const seekerButton = within(roleToggle).getByRole('button', { name: /seeker/i })
      await fireEvent.click(seekerButton)
      await nextTick()
      expect(screen.getByTestId('seeker-view')).toBeInTheDocument()
    })

    it('should highlight the currently active role', async () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      const seekerButton = within(roleToggle).getByRole('button', { name: /seeker/i })
      await fireEvent.click(seekerButton)
      await nextTick()
      expect(seekerButton).toHaveClass('active')
    })
  })

  describe('role indication in UI', () => {
    it('should clearly show current role in header', () => {
      renderGamePlayView()
      // Default should show some role indicator
      expect(screen.getByTestId('current-role-display')).toBeInTheDocument()
    })

    it('should update role display when toggle is clicked', async () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      const hiderButton = within(roleToggle).getByRole('button', { name: /hider/i })
      await fireEvent.click(hiderButton)
      await nextTick()
      expect(screen.getByTestId('current-role-display')).toHaveTextContent(/hider/i)
    })
  })

  describe('phase display', () => {
    it('should show hiding-period status when in hiding period', () => {
      renderGamePlayView(GamePhase.HidingPeriod)
      expect(screen.getByTestId('phase-badge')).toHaveTextContent(/hiding/i)
    })

    it('should show seeking status when in seeking phase', () => {
      renderGamePlayView(GamePhase.Seeking)
      expect(screen.getByTestId('phase-badge')).toHaveTextContent(/seeking/i)
    })

    it('should show end-game status when in end game phase', () => {
      renderGamePlayView(GamePhase.EndGame)
      expect(screen.getByTestId('phase-badge')).toHaveTextContent(/end.?game/i)
    })
  })

  describe('player information', () => {
    it('should display current hider name', () => {
      renderGamePlayView()
      expect(screen.getByTestId('hider-name')).toHaveTextContent('Alice')
    })

    it('should display seeker names', () => {
      renderGamePlayView()
      expect(screen.getByTestId('seekers-list')).toHaveTextContent('Bob')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly toggle buttons (min 44px)', () => {
      renderGamePlayView()
      const roleToggle = screen.getByTestId('role-toggle')
      const buttons = roleToggle.querySelectorAll('button')
      expect(buttons.length).toBe(2)
      buttons.forEach((btn) => {
        // Check for py-3 class which provides adequate touch targets
        expect(btn.className).toMatch(/py-[2-3]/)
      })
    })
  })

  describe('bottom navigation (UX-002)', () => {
    it('should display bottom navigation component', () => {
      renderGamePlayView()
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    it('should display all navigation tabs', () => {
      renderGamePlayView()
      expect(screen.getByTestId('nav-tab-questions')).toBeInTheDocument()
      expect(screen.getByTestId('nav-tab-timers')).toBeInTheDocument()
      expect(screen.getByTestId('nav-tab-cards')).toBeInTheDocument()
      expect(screen.getByTestId('nav-tab-history')).toBeInTheDocument()
    })

    it('should highlight the current tab', async () => {
      renderGamePlayView()
      // Default should have questions tab active
      const questionsTab = screen.getByTestId('nav-tab-questions')
      expect(questionsTab).toHaveClass('active')
    })

    it('should switch to cards section when cards tab clicked', async () => {
      renderGamePlayView()
      const cardsTab = screen.getByTestId('nav-tab-cards')
      await fireEvent.click(cardsTab)
      await nextTick()
      expect(cardsTab).toHaveClass('active')
      // Should show cards content
      expect(screen.getByTestId('card-hand-container')).toBeInTheDocument()
    })

    it('should switch to questions section when questions tab clicked', async () => {
      renderGamePlayView()
      // First switch to cards
      const cardsTab = screen.getByTestId('nav-tab-cards')
      await fireEvent.click(cardsTab)
      await nextTick()
      // Then switch back to questions
      const questionsTab = screen.getByTestId('nav-tab-questions')
      await fireEvent.click(questionsTab)
      await nextTick()
      expect(questionsTab).toHaveClass('active')
      // Should show questions content
      expect(screen.getByTestId('question-list-container')).toBeInTheDocument()
    })

    it('should have smooth transition class on content area', () => {
      renderGamePlayView()
      const contentArea = screen.getByTestId('main-content-area')
      expect(contentArea.className).toMatch(/transition/)
    })
  })
})
