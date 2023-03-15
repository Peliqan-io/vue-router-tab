import { emptyObj } from '../util'

// right click menu
export default {
  data() {
    return {
      // right click menu
      contextData: {
        id: null,
        index: -1,
        left: 0,
        top: 0
      }
    }
  },

  computed: {
    // menu configuration
    contextMenu() {
      return Array.isArray(this.contextmenu) ? this.contextmenu : undefined
    }
  },

  watch: {
    // Routing switch hides the right-click menu
    $route() {
      this.hideContextmenu()
    },

    // Drag and drop sort to hide the right-click menu
    onDragSort() {
      this.hideContextmenu()
    }
  },

  mounted() {
    // Display the right-click menu, bind the click to close event
    document.addEventListener('click', this.contextmenuClickOutSide)
  },

  destroyed() {
    // Hide the right-click menu and remove the click to close event
    document.removeEventListener('click', this.contextmenuClickOutSide)
  },

  methods: {
    // Display tab context menu
    async showContextmenu(id, index, e) {
      // close the opened menu
      if (id !== null && this.contextData.id !== null) {
        this.hideContextmenu()
        await this.$nextTick()
      }

      // menu positioning
      const { clientY: top, clientX: left } = e || emptyObj
      Object.assign(this.contextData, { id, index, top, left })
    },

    // Close the right-click menu of the tab
    hideContextmenu() {
      this.showContextmenu(null, -1)
    },

    // Click outside the menu to close
    contextmenuClickOutSide(e) {
      if (e.target !== this.$el.querySelector('.router-tab-contextmenu')) {
        this.hideContextmenu()
      }
    }
  }
}
