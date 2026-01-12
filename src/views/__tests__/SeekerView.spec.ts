import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SeekerView from '../SeekerView.vue'
import { useCardStore } from '@/stores/cardStore'
import { useGameStore } from '@/stores/gameStore'
import { GameSize } from '@/types/question'

describe('SeekerView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Set to seeking phase by default - need to start round and end hiding period
    const gameStore = useGameStore()
    const player = gameStore.addPlayer('Test Player')
    gameStore.startRound(player.id)
    gameStore.startSeeking()
  })

  describe('curse activation UI (PHYS-002)', () => {
    describe('curse trigger button', () => {
      it('should show "Hider Played Curse" button in seeker view', () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })

        expect(wrapper.find('[data-testid="hider-played-curse-button"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Hider Played Curse')
      })

      it('should open curse selection modal when button clicked', async () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })

        const button = wrapper.find('[data-testid="hider-played-curse-button"]')
        await button.trigger('click')

        expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(true)
      })
    })

    describe('curse activation', () => {
      it('should add selected curse to active curses when confirmed', async () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })
        const cardStore = useCardStore()

        // Open the modal
        await wrapper.find('[data-testid="hider-played-curse-button"]').trigger('click')

        // Select a curse
        await wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]').trigger('click')

        // Confirm
        await wrapper.find('[data-testid="confirm-button"]').trigger('click')

        expect(cardStore.activeCurses.length).toBe(1)
        expect(cardStore.activeCurses[0]!.curseId).toBe('curse-lemon-phylactery')
      })

      it('should start countdown for time-based curses', async () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })
        const cardStore = useCardStore()

        // Open the modal
        await wrapper.find('[data-testid="hider-played-curse-button"]').trigger('click')

        // Select Gambler's Feet (time-based curse)
        await wrapper.find('[data-testid="curse-item-curse-gamblers-feet"]').trigger('click')

        // Confirm
        await wrapper.find('[data-testid="confirm-button"]').trigger('click')

        expect(cardStore.activeCurses.length).toBe(1)
        expect(cardStore.activeCurses[0]!.durationMinutes).toBeDefined()
        expect(cardStore.activeCurses[0]!.durationMinutes!.small).toBe(20)
      })

      it('should show curse restrictions in curse display', async () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })

        // Open the modal
        await wrapper.find('[data-testid="hider-played-curse-button"]').trigger('click')

        // Select a curse
        await wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]').trigger('click')

        // Confirm
        await wrapper.find('[data-testid="confirm-button"]').trigger('click')
        await flushPromises()

        // Curse display section should show
        expect(wrapper.find('[data-testid="seeker-curses-section"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Lemon Phylactery')
      })

      it('should close modal after confirmation', async () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })

        // Open the modal
        await wrapper.find('[data-testid="hider-played-curse-button"]').trigger('click')
        expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(true)

        // Select a curse
        await wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]').trigger('click')

        // Confirm
        await wrapper.find('[data-testid="confirm-button"]').trigger('click')

        expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(false)
      })

      it('should close modal when cancel is clicked', async () => {
        const wrapper = mount(SeekerView, {
          props: {
            gameSize: GameSize.Small,
          },
        })

        // Open the modal
        await wrapper.find('[data-testid="hider-played-curse-button"]').trigger('click')
        expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(true)

        // Cancel
        await wrapper.find('[data-testid="cancel-button"]').trigger('click')

        expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(false)
      })
    })
  })
})
