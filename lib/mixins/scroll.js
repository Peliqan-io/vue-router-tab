import { debounce } from '../util/decorator'

// tab scrolling
export default {
  watch: {
    activeTabId: {
      async handler() {
        if (!this.$el) return

        // When the tab is activated, if the current tab is not in the visible area, the tab will be scrolled
        await this.$nextTick()

        this.adjust()
      },

      immediate: true
    }
  },

  mounted() {
    // Adjust the tab scrolling display when the browser window size changes
    window.addEventListener('resize', this.adjust)
  },

  destroyed() {
    // Remove the listening event after destruction
    window.removeEventListener('resize', this.adjust)
  },

  methods: {
    // Adjust tab scrolling to ensure that the current tab is in the visible area
    @debounce()
    adjust() {
      if (!this.$el) return

      const { scroll } = this.$refs

      const cur = this.$el.querySelector('.router-tab__item.is-active')

      if (scroll && cur && !scroll.isInView(cur)) scroll.scrollIntoView(cur)

      // close right click menu
      this.hideContextmenu()
    },

    // tab transition
    onTabTrans() {
      this.adjust()
    }
  }
}
