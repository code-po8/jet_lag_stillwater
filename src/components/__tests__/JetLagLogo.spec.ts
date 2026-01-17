import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/vue'
import JetLagLogo from '../JetLagLogo.vue'

describe('JetLagLogo component (BRAND-001)', () => {
  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render SVG logo element', () => {
      render(JetLagLogo)

      const svg = screen.getByTestId('jet-lag-logo')
      expect(svg).toBeInTheDocument()
      expect(svg.tagName.toLowerCase()).toBe('svg')
    })

    it('should display "JET" and "LAG" text elements', () => {
      render(JetLagLogo)

      expect(screen.getByText('JET')).toBeInTheDocument()
      expect(screen.getByText('LAG')).toBeInTheDocument()
    })

    it('should display "STILLWATER EDITION" subtitle', () => {
      render(JetLagLogo)

      expect(screen.getByText('STILLWATER EDITION')).toBeInTheDocument()
    })

    it('should include pistol firing hand gesture graphic', () => {
      render(JetLagLogo)

      // The pistol firing hand is represented as a path/group element
      const pistolElement = screen.getByTestId('logo-pistol-hand')
      expect(pistolElement).toBeInTheDocument()
    })
  })

  describe('size prop', () => {
    it('should render medium size by default', () => {
      render(JetLagLogo)

      const svg = screen.getByTestId('jet-lag-logo')
      // Medium size should have specific width
      expect(svg).toHaveAttribute('width', '200')
    })

    it('should render small size when size="sm"', () => {
      render(JetLagLogo, {
        props: { size: 'sm' },
      })

      const svg = screen.getByTestId('jet-lag-logo')
      expect(svg).toHaveAttribute('width', '120')
    })

    it('should render large size when size="lg"', () => {
      render(JetLagLogo, {
        props: { size: 'lg' },
      })

      const svg = screen.getByTestId('jet-lag-logo')
      expect(svg).toHaveAttribute('width', '280')
    })
  })

  describe('accessibility', () => {
    it('should have appropriate aria-label for screen readers', () => {
      render(JetLagLogo)

      const svg = screen.getByTestId('jet-lag-logo')
      expect(svg).toHaveAttribute('aria-label', 'Jet Lag: Stillwater Edition logo')
    })

    it('should have role="img" for screen readers', () => {
      render(JetLagLogo)

      const svg = screen.getByTestId('jet-lag-logo')
      expect(svg).toHaveAttribute('role', 'img')
    })
  })
})
