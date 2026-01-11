/**
 * Tests for QuestionHistory component (Q-005)
 *
 * Acceptance Criteria:
 * - View shows all asked questions in reverse chronological order
 * - Each entry shows: question, answer, timestamp, category
 * - Vetoed questions marked distinctly (returned to available)
 * - List is scrollable
 * - Tapping an entry shows full details
 * - Option to filter by category
 * - Accessible from both hider and seeker views
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia, setActivePinia } from 'pinia'
import QuestionHistory from '../QuestionHistory.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { QuestionCategoryId, type AskedQuestion } from '@/types/question'

// Mock asked questions for testing (using real question IDs from the data file)
const mockAskedQuestions: AskedQuestion[] = [
  {
    questionId: 'matching-transit-airport',
    categoryId: QuestionCategoryId.Matching,
    answer: 'Yes, same airport',
    askedAt: new Date('2026-01-11T10:00:00'),
    answeredAt: new Date('2026-01-11T10:02:00'),
    vetoed: false,
  },
  {
    questionId: 'measuring-poi-cemetery',
    categoryId: QuestionCategoryId.Measuring,
    answer: 'Closer',
    askedAt: new Date('2026-01-11T10:30:00'),
    answeredAt: new Date('2026-01-11T10:32:00'),
    vetoed: false,
  },
  {
    questionId: 'radar-0.25',
    categoryId: QuestionCategoryId.Radar,
    answer: 'No',
    askedAt: new Date('2026-01-11T11:00:00'),
    answeredAt: new Date('2026-01-11T11:01:00'),
    vetoed: false,
  },
]

// Mock a vetoed question (for history tracking purposes)
const mockVetoedQuestion: AskedQuestion = {
  questionId: 'matching-transit-line',
  categoryId: QuestionCategoryId.Matching,
  answer: '',
  askedAt: new Date('2026-01-11T09:00:00'),
  answeredAt: new Date('2026-01-11T09:01:00'),
  vetoed: true,
}

describe('QuestionHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  describe('display requirements', () => {
    it('should display the history container', () => {
      render(QuestionHistory)
      expect(screen.getByTestId('question-history-container')).toBeTruthy()
    })

    it('should display a header', () => {
      render(QuestionHistory)
      expect(screen.getByRole('heading', { name: /question history/i })).toBeTruthy()
    })

    it('should show empty state when no questions asked', () => {
      render(QuestionHistory)
      expect(screen.getByText(/no questions have been asked yet/i)).toBeTruthy()
    })
  })

  describe('reverse chronological order', () => {
    it('should display questions in reverse chronological order (newest first)', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()

      // Add questions in chronological order
      questionStore.askedQuestions.push(...mockAskedQuestions)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItems = screen.getAllByTestId(/^history-item-/)
      expect(historyItems.length).toBe(3)

      // Verify order is reverse chronological (newest first = radar, then measuring, then matching)
      expect(historyItems[0]!.getAttribute('data-testid')).toBe('history-item-radar-0.25')
      expect(historyItems[1]!.getAttribute('data-testid')).toBe('history-item-measuring-poi-cemetery')
      expect(historyItems[2]!.getAttribute('data-testid')).toBe('history-item-matching-transit-airport')
    })
  })

  describe('entry display - question, answer, timestamp, category', () => {
    it('should display the question text', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      // The question text should be visible (from the questions data file)
      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      // Question text contains "nearest airport" from the data
      expect(historyItem.textContent).toContain('airport')
    })

    it('should display the answer', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      expect(screen.getByText('Yes, same airport')).toBeTruthy()
    })

    it('should display the timestamp', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      // Should show formatted time (e.g., "10:00 AM" or similar)
      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      expect(historyItem.querySelector('[data-testid="timestamp"]')).toBeTruthy()
    })

    it('should display the category name', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      // Category name shows in the history item badge (not filter since no filter when only one category)
      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      expect(historyItem.textContent).toContain('Matching')
    })
  })

  describe('vetoed questions', () => {
    it('should mark vetoed questions distinctly', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockVetoedQuestion)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItem = screen.getByTestId('history-item-matching-transit-line')
      expect(historyItem.textContent).toContain('Vetoed')
    })

    it('should show vetoed badge for vetoed questions', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockVetoedQuestion)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      expect(screen.getByTestId('vetoed-badge')).toBeTruthy()
    })

    it('should not show vetoed badge for regular answered questions', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      expect(screen.queryByTestId('vetoed-badge')).toBeFalsy()
    })
  })

  describe('scrollable list', () => {
    it('should have a scrollable container', () => {
      render(QuestionHistory)
      const container = screen.getByTestId('question-history-container')
      expect(container.classList.contains('overflow-y-auto')).toBe(true)
    })
  })

  describe('entry details on tap', () => {
    it('should emit select event when entry is tapped', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      const user = userEvent.setup()
      const { emitted } = render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      await user.click(historyItem)

      expect(emitted()).toHaveProperty('select')
      expect(emitted().select![0]).toEqual([mockAskedQuestions[0]])
    })

    it('should have touch-friendly tap targets (min 44px)', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      // Check for min-h-11 (44px) class or similar
      expect(historyItem.classList.contains('min-h-11') || historyItem.classList.contains('py-3')).toBe(true)
    })
  })

  describe('category filter', () => {
    it('should display category filter options', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(...mockAskedQuestions)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      expect(screen.getByTestId('category-filter')).toBeTruthy()
    })

    it('should have "All" option selected by default', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(...mockAskedQuestions)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const allButton = screen.getByRole('button', { name: /all/i })
      expect(allButton.classList.contains('bg-blue-600') || allButton.getAttribute('aria-pressed') === 'true').toBe(true)
    })

    it('should filter questions when category is selected', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(...mockAskedQuestions)

      const user = userEvent.setup()
      render(QuestionHistory, { global: { plugins: [pinia] } })

      // Click Matching filter button (use within to scope to filter container)
      const filterContainer = screen.getByTestId('category-filter')
      const matchingButton = within(filterContainer).getByRole('button', { name: /matching/i })
      await user.click(matchingButton)

      // Should only show matching questions
      const historyItems = screen.getAllByTestId(/^history-item-/)
      expect(historyItems.length).toBe(1)
      expect(historyItems[0]!.getAttribute('data-testid')).toBe('history-item-matching-transit-airport')
    })

    it('should show all questions when "All" is selected', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(...mockAskedQuestions)

      const user = userEvent.setup()
      render(QuestionHistory, { global: { plugins: [pinia] } })

      const filterContainer = screen.getByTestId('category-filter')

      // First filter to Matching
      await user.click(within(filterContainer).getByRole('button', { name: /matching/i }))

      // Then click All
      await user.click(within(filterContainer).getByRole('button', { name: /all/i }))

      // Should show all questions
      const historyItems = screen.getAllByTestId(/^history-item-/)
      expect(historyItems.length).toBe(3)
    })

    it('should only show categories with asked questions in filter', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      // Only add Matching questions
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const filterContainer = screen.getByTestId('category-filter')

      // Should have All and Matching filter buttons
      expect(within(filterContainer).getByRole('button', { name: /all/i })).toBeTruthy()
      expect(within(filterContainer).getByRole('button', { name: /matching/i })).toBeTruthy()
      // Should not have Tentacle filter (no questions asked in that category)
      expect(within(filterContainer).queryByRole('button', { name: /tentacle/i })).toBeFalsy()
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(QuestionHistory)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.textContent).toContain('History')
    })

    it('should have proper ARIA labels for history items', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      expect(historyItem.getAttribute('role')).toBe('button')
      expect(historyItem.getAttribute('tabindex')).toBe('0')
    })

    it('should support keyboard navigation', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      const user = userEvent.setup()
      const { emitted } = render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      historyItem.focus()
      await user.keyboard('{Enter}')

      expect(emitted()).toHaveProperty('select')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have proper spacing for touch targets', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const questionStore = useQuestionStore()
      questionStore.askedQuestions.push(mockAskedQuestions[0]!)

      render(QuestionHistory, { global: { plugins: [pinia] } })

      const historyItem = screen.getByTestId('history-item-matching-transit-airport')
      // Should have padding for comfortable touch targets
      expect(historyItem.classList.contains('p-4') || historyItem.classList.contains('py-3')).toBe(true)
    })

    it('should be scrollable when content overflows', () => {
      render(QuestionHistory)
      const container = screen.getByTestId('question-history-container')
      expect(container.classList.contains('overflow-y-auto')).toBe(true)
    })
  })
})
