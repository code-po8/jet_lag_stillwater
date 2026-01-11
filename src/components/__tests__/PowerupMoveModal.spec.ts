import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PowerupMoveModal from '../PowerupMoveModal.vue'
import { type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

describe('PowerupMoveModal', () => {
  let wrapper: VueWrapper

  const createMovePowerupCard = (): CardInstance => ({
    id: 'powerup-move',
    instanceId: 'move-test-instance',
    type: CardType.Powerup,
    name: 'Move',
    description: 'Establish a new hiding zone',
    powerupType: PowerupType.Move,
    effect: 'Discard your hand and send the seekers the location of your transit station. Grants a new hiding period to establish a new hiding zone.',
    quantity: 1,
    canPlayDuringEndgame: false,
  } as CardInstance)

  const createOtherPowerupCard = (): CardInstance => ({
    id: 'powerup-veto',
    instanceId: 'veto-test-instance',
    type: CardType.Powerup,
    name: 'Veto Question',
    description: 'Decline to answer',
    powerupType: PowerupType.Veto,
    effect: 'No answer is given',
    quantity: 4,
    canPlayDuringEndgame: true,
  } as CardInstance)

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountModal = (props: {
    powerupCard: CardInstance | null
    handSize?: number
    gameSize?: GameSize
  }) => {
    return mount(PowerupMoveModal, {
      props: {
        powerupCard: props.powerupCard,
        handSize: props.handSize ?? 4,
        gameSize: props.gameSize ?? GameSize.Small,
      },
    })
  }

  describe('visibility', () => {
    it('should not render when powerupCard is null', () => {
      wrapper = mountModal({ powerupCard: null })

      expect(wrapper.find('[data-testid="move-modal"]').exists()).toBe(false)
    })

    it('should render when powerupCard is provided and is Move type', () => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })

      expect(wrapper.find('[data-testid="move-modal"]').exists()).toBe(true)
    })

    it('should not render when powerupCard is not a Move powerup', () => {
      wrapper = mountModal({ powerupCard: createOtherPowerupCard() })

      expect(wrapper.find('[data-testid="move-modal"]').exists()).toBe(false)
    })
  })

  describe('header and content', () => {
    beforeEach(() => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })
    })

    it('should display the powerup card name in header', () => {
      expect(wrapper.text()).toContain('Move')
    })

    it('should display the card effect description', () => {
      expect(wrapper.text()).toContain('Discard your hand')
    })

    it('should show warning about discarding hand', () => {
      expect(wrapper.text()).toContain('discard')
    })
  })

  describe('hand size display', () => {
    it('should show how many cards will be discarded', () => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard(), handSize: 5 })

      // Should mention 4 cards (5 - 1 Move card being played)
      expect(wrapper.text()).toMatch(/4|cards/i)
    })

    it('should show zero cards when Move is the only card', () => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard(), handSize: 1 })

      // Should mention 0 other cards will be discarded
      expect(wrapper.find('[data-testid="discard-count"]').text()).toContain('0')
    })
  })

  describe('new hiding period duration display', () => {
    it('should show 10 minutes for Small game size', () => {
      wrapper = mountModal({
        powerupCard: createMovePowerupCard(),
        gameSize: GameSize.Small,
      })

      expect(wrapper.text()).toContain('10')
    })

    it('should show 20 minutes for Medium game size', () => {
      wrapper = mountModal({
        powerupCard: createMovePowerupCard(),
        gameSize: GameSize.Medium,
      })

      expect(wrapper.text()).toContain('20')
    })

    it('should show 60 minutes for Large game size', () => {
      wrapper = mountModal({
        powerupCard: createMovePowerupCard(),
        gameSize: GameSize.Large,
      })

      expect(wrapper.text()).toContain('60')
    })
  })

  describe('confirm button', () => {
    beforeEach(() => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })
    })

    it('should display confirm button', () => {
      expect(wrapper.find('[data-testid="confirm-move-btn"]').exists()).toBe(true)
    })

    it('should emit confirm event when clicked', async () => {
      await wrapper.find('[data-testid="confirm-move-btn"]').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
    })
  })

  describe('cancel button', () => {
    beforeEach(() => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })
    })

    it('should display cancel button', () => {
      expect(wrapper.find('[data-testid="cancel-btn"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      await wrapper.find('[data-testid="cancel-btn"]').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('seekers notification preview', () => {
    beforeEach(() => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })
    })

    it('should show message about notifying seekers', () => {
      expect(wrapper.text()).toMatch(/seekers|notify|station|location/i)
    })

    it('should explain that seekers will be frozen', () => {
      expect(wrapper.text()).toMatch(/frozen|stay put|wait/i)
    })
  })

  describe('mobile-friendly design', () => {
    beforeEach(() => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })
    })

    it('should have touch-friendly confirm button (min 44px)', () => {
      const confirmBtn = wrapper.find('[data-testid="confirm-move-btn"]')
      expect(confirmBtn.classes()).toContain('min-h-11')
    })

    it('should have touch-friendly cancel button (min 44px)', () => {
      const cancelBtn = wrapper.find('[data-testid="cancel-btn"]')
      expect(cancelBtn.classes()).toContain('min-h-11')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      wrapper = mountModal({ powerupCard: createMovePowerupCard() })
    })

    it('should have proper ARIA labels for modal', () => {
      const modal = wrapper.find('[data-testid="move-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
    })
  })
})
