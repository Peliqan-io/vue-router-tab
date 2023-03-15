import { emptyObj } from '../util'

// The browser window is closed or refreshed
const beforeunload = ($tabs, tabId, beforePageLeave) => e => {
  if (!$tabs && $tabs._isDestroyed) return

  const tab = $tabs.items.find(item => item.id === tabId)
  const msg = beforePageLeave(tab, 'unload')

  if (msg && typeof msg === 'string') {
    e.preventDefault()
    e.returnValue = msg

    // Switch if it is not the current tab
    if ($tabs.activeTabId !== tabId) {
      $tabs.open(tab.to, false, false)
    }

    return msg
  }
}

/** Update tab */
function updateTab(info) {
  const tab = typeof info === 'string' ? { title: info } : info
  const { activeTab } = this.$tabs || emptyObj

  if (tab && activeTab) {
    for (const key in tab) {
      if (!['id', 'to'].includes(key)) {
        this.$set(activeTab, key, tab[key])
      }
    }
  }
}

// route page mixin
export default {
  watch: {
    // Monitor the routerTab field and update the tab information
    routeTab: {
      handler(val) {
        if (!val || this._inactive) return
        updateTab.call(this, val)
      },
      deep: true,
      immediate: true
    }
  },

  // Create pre-record cache
  mounted() {
    const { $tabs } = this
    const { beforePageLeave } =
      (this.$vnode && this.$vnode.componentOptions.Ctor.options) || emptyObj

    // page leave confirmation
    if ($tabs && beforePageLeave) {
      window.addEventListener(
        'beforeunload',
        (this._beforeunload = beforeunload(
          $tabs,
          $tabs.activeTabId,
          beforePageLeave.bind(this)
        ))
      )
    }
  },

  // Update the tab when the tab is activated
  activated() {
    this.routeTab && updateTab.call(this, this.routeTab)
  },

  destroyed() {
    if (this._beforeunload) {
      window.removeEventListener('beforeunload', this._beforeunload)
    }
  }
}
