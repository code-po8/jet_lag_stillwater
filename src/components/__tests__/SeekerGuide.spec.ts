import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/vue'
import SeekerGuide from '../SeekerGuide.vue'

describe('SeekerGuide', () => {
  afterEach(() => {
    cleanup()
  })

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      render(SeekerGuide, {
        props: { isOpen: false },
      })

      expect(screen.queryByTestId('seeker-guide-modal')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      expect(screen.getByTestId('seeker-guide-modal')).toBeInTheDocument()
    })

    it('should have dialog role when open', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      const modal = screen.getByTestId('seeker-guide-modal')
      expect(modal).toHaveAttribute('role', 'dialog')
    })
  })

  describe('header', () => {
    it('should display guide title', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      expect(screen.getByText(/seeker guide/i)).toBeInTheDocument()
    })

    it('should have close button', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      expect(screen.getByTestId('seeker-guide-close-btn')).toBeInTheDocument()
    })
  })

  describe('content sections', () => {
    beforeEach(() => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })
    })

    it('should have hiding period section', () => {
      const section = screen.getByTestId('guide-section-hiding-period')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-hiding-period-header')
      expect(header.textContent).toMatch(/hiding period/i)
    })

    it('should have asking questions section', () => {
      const section = screen.getByTestId('guide-section-asking-questions')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-asking-questions-header')
      expect(header.textContent).toMatch(/asking questions/i)
    })

    it('should have question categories section', () => {
      const section = screen.getByTestId('guide-section-categories')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-categories-header')
      expect(header.textContent).toMatch(/question categor/i)
    })

    it('should have recording answers section', () => {
      const section = screen.getByTestId('guide-section-recording-answers')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-recording-answers-header')
      expect(header.textContent).toMatch(/recording answers/i)
    })

    it('should have active curses section', () => {
      const section = screen.getByTestId('guide-section-curses')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-curses-header')
      expect(header.textContent).toMatch(/curse/i)
    })

    it('should have time traps section', () => {
      const section = screen.getByTestId('guide-section-time-traps')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-time-traps-header')
      expect(header.textContent).toMatch(/time trap/i)
    })

    it('should have end-game section', () => {
      const section = screen.getByTestId('guide-section-end-game')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-end-game-header')
      expect(header.textContent).toMatch(/end.?game/i)
    })
  })

  describe('section content details', () => {
    beforeEach(() => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })
    })

    it('should explain what seekers do during hiding period', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-hiding-period-header'))
      const section = screen.getByTestId('guide-section-hiding-period')
      expect(section.textContent).toMatch(/wait/i)
    })

    it('should explain how to ask questions', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-asking-questions-header'))
      const section = screen.getByTestId('guide-section-asking-questions')
      expect(section.textContent).toMatch(/ask|question/i)
    })

    it('should explain draw and keep rules', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-categories-header'))
      const section = screen.getByTestId('guide-section-categories')
      expect(section.textContent).toMatch(/draw|keep/i)
    })

    it('should explain how to record answers', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-recording-answers-header'))
      const section = screen.getByTestId('guide-section-recording-answers')
      expect(section.textContent).toMatch(/answer|record/i)
    })

    it('should explain curse restrictions on seekers', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-curses-header'))
      const section = screen.getByTestId('guide-section-curses')
      expect(section.textContent).toMatch(/restrict/i)
    })

    it('should explain what happens when time traps trigger', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-time-traps-header'))
      const section = screen.getByTestId('guide-section-time-traps')
      expect(section.textContent).toMatch(/trigger|bonus/i)
    })

    it('should explain finding the hider in end-game', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-end-game-header'))
      const section = screen.getByTestId('guide-section-end-game')
      expect(section.textContent).toMatch(/find|zone/i)
    })
  })

  describe('interactions', () => {
    it('should emit close when close button clicked', async () => {
      const { emitted } = render(SeekerGuide, {
        props: { isOpen: true },
      })

      await fireEvent.click(screen.getByTestId('seeker-guide-close-btn'))

      expect(emitted()).toHaveProperty('close')
      expect(emitted().close).toHaveLength(1)
    })

    it('should emit close when overlay background clicked', async () => {
      const { emitted } = render(SeekerGuide, {
        props: { isOpen: true },
      })

      await fireEvent.click(screen.getByTestId('seeker-guide-overlay'))

      expect(emitted()).toHaveProperty('close')
    })

    it('should not emit close when modal content clicked', async () => {
      const { emitted } = render(SeekerGuide, {
        props: { isOpen: true },
      })

      await fireEvent.click(screen.getByTestId('seeker-guide-content'))

      expect(emitted()).not.toHaveProperty('close')
    })
  })

  describe('collapsible sections', () => {
    it('should be able to expand a section', async () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      const sectionHeader = screen.getByTestId('guide-section-hiding-period-header')
      await fireEvent.click(sectionHeader)

      const section = screen.getByTestId('guide-section-hiding-period')
      expect(section).toHaveAttribute('data-expanded', 'true')
    })

    it('should toggle section on header click', async () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      const sectionHeader = screen.getByTestId('guide-section-hiding-period-header')

      // Click to expand
      await fireEvent.click(sectionHeader)
      expect(screen.getByTestId('guide-section-hiding-period')).toHaveAttribute(
        'data-expanded',
        'true',
      )

      // Click again to collapse
      await fireEvent.click(sectionHeader)
      expect(screen.getByTestId('guide-section-hiding-period')).toHaveAttribute(
        'data-expanded',
        'false',
      )
    })
  })

  describe('mobile-friendly layout', () => {
    it('should have scrollable content area', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      const content = screen.getByTestId('seeker-guide-content')
      expect(content).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have aria-modal attribute', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      const modal = screen.getByTestId('seeker-guide-modal')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby pointing to title', () => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })

      const modal = screen.getByTestId('seeker-guide-modal')
      const labelledBy = modal.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()

      const title = document.getElementById(labelledBy!)
      expect(title).toBeInTheDocument()
      expect(title?.textContent).toMatch(/seeker guide/i)
    })
  })

  describe('standalone mode section (PHYS-003)', () => {
    beforeEach(() => {
      render(SeekerGuide, {
        props: { isOpen: true },
      })
    })

    it('should have standalone mode section', () => {
      const section = screen.getByTestId('guide-section-standalone')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-standalone-header')
      expect(header.textContent).toMatch(/standalone mode/i)
    })

    it('should explain standalone mode concept', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-standalone-header'))
      const section = screen.getByTestId('guide-section-standalone')
      expect(section.textContent).toMatch(/separate devices|independent/i)
    })

    it('should explain seeker device setup', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-standalone-header'))
      const section = screen.getByTestId('guide-section-standalone')
      expect(section.textContent).toMatch(/hider played curse|manual/i)
    })

    it('should explain what hider communicates to seekers', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-standalone-header'))
      const section = screen.getByTestId('guide-section-standalone')
      expect(section.textContent).toMatch(/announce|communicate|tell|verbally/i)
    })

    it('should explain how to receive curse announcements', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-standalone-header'))
      const section = screen.getByTestId('guide-section-standalone')
      expect(section.textContent).toMatch(/curse/i)
    })

    it('should explain how to handle time trap announcements', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-standalone-header'))
      const section = screen.getByTestId('guide-section-standalone')
      expect(section.textContent).toMatch(/time trap/i)
    })

    it('should explain question and answer flow', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-standalone-header'))
      const section = screen.getByTestId('guide-section-standalone')
      expect(section.textContent).toMatch(/question|answer/i)
    })
  })
})
