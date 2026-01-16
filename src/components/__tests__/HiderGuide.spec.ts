import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/vue'
import HiderGuide from '../HiderGuide.vue'

describe('HiderGuide', () => {
  afterEach(() => {
    cleanup()
  })

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      render(HiderGuide, {
        props: { isOpen: false },
      })

      expect(screen.queryByTestId('hider-guide-modal')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      expect(screen.getByTestId('hider-guide-modal')).toBeInTheDocument()
    })

    it('should have dialog role when open', () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      const modal = screen.getByTestId('hider-guide-modal')
      expect(modal).toHaveAttribute('role', 'dialog')
    })
  })

  describe('header', () => {
    it('should display guide title', () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      expect(screen.getByText(/hider guide/i)).toBeInTheDocument()
    })

    it('should have close button', () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      expect(screen.getByTestId('hider-guide-close-btn')).toBeInTheDocument()
    })
  })

  describe('content sections', () => {
    beforeEach(() => {
      render(HiderGuide, {
        props: { isOpen: true },
      })
    })

    it('should have hiding period section', () => {
      const section = screen.getByTestId('guide-section-hiding-period')
      expect(section).toBeInTheDocument()
      // Check that the section header contains "Hiding Period"
      const header = screen.getByTestId('guide-section-hiding-period-header')
      expect(header.textContent).toMatch(/hiding period/i)
    })

    it('should have card hand section', () => {
      const section = screen.getByTestId('guide-section-card-hand')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-card-hand-header')
      expect(header.textContent).toMatch(/your cards/i)
    })

    it('should have powerup cards section', () => {
      const section = screen.getByTestId('guide-section-powerups')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-powerups-header')
      expect(header.textContent).toMatch(/powerup cards/i)
    })

    it('should have curse cards section', () => {
      const section = screen.getByTestId('guide-section-curses')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-curses-header')
      expect(header.textContent).toMatch(/curse cards/i)
    })

    it('should have time bonus section', () => {
      const section = screen.getByTestId('guide-section-time-bonus')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-time-bonus-header')
      expect(header.textContent).toMatch(/time bonus/i)
    })

    it('should have time trap section', () => {
      const section = screen.getByTestId('guide-section-time-traps')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-time-traps-header')
      expect(header.textContent).toMatch(/time trap/i)
    })

    it('should have answering questions section', () => {
      const section = screen.getByTestId('guide-section-questions')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-questions-header')
      expect(header.textContent).toMatch(/answering questions/i)
    })

    it('should have move powerup section', () => {
      const section = screen.getByTestId('guide-section-move')
      expect(section).toBeInTheDocument()
      const header = screen.getByTestId('guide-section-move-header')
      expect(header.textContent).toMatch(/move powerup/i)
    })
  })

  describe('section content details', () => {
    // Note: Sections are collapsed by default, but textContent still includes hidden content
    beforeEach(() => {
      render(HiderGuide, {
        props: { isOpen: true },
      })
    })

    it('should explain hiding period timer purpose', async () => {
      // Expand the section to ensure content is rendered
      await fireEvent.click(screen.getByTestId('guide-section-hiding-period-header'))
      const section = screen.getByTestId('guide-section-hiding-period')
      expect(section.textContent).toMatch(/minutes.*hide/i)
    })

    it('should explain card types in card hand section', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-card-hand-header'))
      const section = screen.getByTestId('guide-section-card-hand')
      expect(section.textContent).toMatch(/time bonus/i)
      expect(section.textContent).toMatch(/powerup/i)
      expect(section.textContent).toMatch(/curse/i)
    })

    it('should list powerup types', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-powerups-header'))
      const section = screen.getByTestId('guide-section-powerups')
      expect(section.textContent).toMatch(/discard.*draw/i)
      expect(section.textContent).toMatch(/duplicate/i)
    })

    it('should explain curse effect on seekers', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-curses-header'))
      const section = screen.getByTestId('guide-section-curses')
      expect(section.textContent).toMatch(/seeker/i)
      expect(section.textContent).toMatch(/restrict/i)
    })

    it('should explain time bonus adds time', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-time-bonus-header'))
      const section = screen.getByTestId('guide-section-time-bonus')
      expect(section.textContent).toMatch(/add.*time|extra.*minutes/i)
    })

    it('should explain how to set time traps', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-time-traps-header'))
      const section = screen.getByTestId('guide-section-time-traps')
      expect(section.textContent).toMatch(/location|zone|set/i)
    })

    it('should explain veto option for questions', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-questions-header'))
      const section = screen.getByTestId('guide-section-questions')
      expect(section.textContent).toMatch(/veto/i)
    })

    it('should explain move allows changing hiding zone', async () => {
      await fireEvent.click(screen.getByTestId('guide-section-move-header'))
      const section = screen.getByTestId('guide-section-move')
      expect(section.textContent).toMatch(/hiding.*zone|relocate|new.*spot/i)
    })
  })

  describe('interactions', () => {
    it('should emit close when close button clicked', async () => {
      const { emitted } = render(HiderGuide, {
        props: { isOpen: true },
      })

      await fireEvent.click(screen.getByTestId('hider-guide-close-btn'))

      expect(emitted()).toHaveProperty('close')
      expect(emitted().close).toHaveLength(1)
    })

    it('should emit close when overlay background clicked', async () => {
      const { emitted } = render(HiderGuide, {
        props: { isOpen: true },
      })

      // Click on the overlay (the element with the modal-overlay class)
      await fireEvent.click(screen.getByTestId('hider-guide-overlay'))

      expect(emitted()).toHaveProperty('close')
    })

    it('should not emit close when modal content clicked', async () => {
      const { emitted } = render(HiderGuide, {
        props: { isOpen: true },
      })

      // Click on the modal content area
      await fireEvent.click(screen.getByTestId('hider-guide-content'))

      expect(emitted()).not.toHaveProperty('close')
    })
  })

  describe('collapsible sections', () => {
    it('should be able to expand a section', async () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      const sectionHeader = screen.getByTestId('guide-section-hiding-period-header')
      await fireEvent.click(sectionHeader)

      // After click, the section content should be visible
      const section = screen.getByTestId('guide-section-hiding-period')
      expect(section).toHaveAttribute('data-expanded', 'true')
    })

    it('should toggle section on header click', async () => {
      render(HiderGuide, {
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
      render(HiderGuide, {
        props: { isOpen: true },
      })

      const content = screen.getByTestId('hider-guide-content')
      expect(content).toBeInTheDocument()
      // Content should be scrollable via CSS - we just check the element exists
    })
  })

  describe('accessibility', () => {
    it('should have aria-modal attribute', () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      const modal = screen.getByTestId('hider-guide-modal')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby pointing to title', () => {
      render(HiderGuide, {
        props: { isOpen: true },
      })

      const modal = screen.getByTestId('hider-guide-modal')
      const labelledBy = modal.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()

      const title = document.getElementById(labelledBy!)
      expect(title).toBeInTheDocument()
      expect(title?.textContent).toMatch(/hider guide/i)
    })
  })
})
