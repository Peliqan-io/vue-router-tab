// Restore after tab refresh
export default {
  computed: {
    // Refresh restore storage key
    restoreKey() {
      const { restore, basePath } = this

      if (!restore || typeof sessionStorage === 'undefined') return ''

      let key = `__t::${basePath}`

      typeof restore === 'string' && (key += `:${restore}`)

      return key
    },

    activeTabKey() {
      const { restoreKey } = this
      return `__a${restoreKey}`
    }
  },

  beforeUpdate() {
    if (!this.items.length) {
      sessionStorage.removeItem(this.activeTabKey)
    } else {
      this.$tabs?.saveActiveTab()
    }
  },

  mounted() {
    // Save tab data before page reload
    window.addEventListener('beforeunload', this.saveTabs)
  },

  destroyed() {
    window.removeEventListener('beforeunload', this.saveTabs)
  },

  watch: {
    // Monitor the change of restoreKey to automatically restore the tab
    restoreKey() {
      if (this.restoreWatch) {
        const { activeTab } = this
        this.initTabs()

        if (!this.activeTab) {
          this.items.push(activeTab)
        }
      }
    }
  },

  methods: {
    saveTabs() {
      const { restoreKey, items } = this
      restoreKey &&
        sessionStorage.setItem(this.restoreKey, JSON.stringify(items))
    },

    saveActiveTab() {
      const { activeTab, activeTabKey, restoreKey } = this

      restoreKey &&
        activeTabKey &&
        sessionStorage.setItem(activeTabKey, JSON.stringify(activeTab))
    },

    clearTabsStore() {
      this.restoreKey && sessionStorage.removeItem(this.restoreKey)
    },

    restoreTabs() {
      if (!this.restoreKey) return false

      let tabs = this.getTabs()
      let hasStore = false

      try {
        tabs = JSON.parse(tabs)

        if (Array.isArray(tabs) && tabs.length) {
          hasStore = true
          this.presetTabs(tabs)
        }
      } catch (e) {}

      return hasStore
    },

    getTabs() {
      const tabs = sessionStorage.getItem(this.restoreKey)
      return tabs
    },

    getLastActiveTab() {
      const { activeTabKey } = this
      return sessionStorage.getItem(activeTabKey)
    }
  }
}
