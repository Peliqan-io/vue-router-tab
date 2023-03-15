import { warn } from '../util/warn'

// get shutdown parameter
function getCloseArgs(args) {
  args = Array.from(args)

  const argsLen = args.length
  const arg = args[0] // get shutdown parameter

  if (!argsLen) {
    // close()
    return {}
  } else if (
    arg &&
    typeof arg === 'object' &&
    !arg.name &&
    !arg.fullPath &&
    !arg.params &&
    !arg.query &&
    !arg.hash
  ) {
    // close({id, path, match, force, to, refresh})
    return arg
  } else {
    // close(path, to)
    const [path, to] = args
    return { path, to }
  }
}

// Is the path consistent or not?
function equalPath(path1, path2) {
  const reg = /\/$/
  return path1.replace(reg, '') === path2.replace(reg, '')
}

// tab operation
export default {
  methods: {
    /**
     * Open the tab (newly opened by default)
     * @param {location} path tab path
     * @param {Boolean} [isReplace = false] whether replace way to replace the current route
     * @param {Boolean | String} [refresh = true] Whether to open a new one, if it is `sameTab`, only the same tab will be opened a new one
     */
    async open(path, isReplace = false, refresh = true) {
      const curId = this.activeTabId
      const tarId = this.getRouteKey(path)
      const isSameTab = equalPath(curId, tarId)

      // Refresh only when the route is opened on the same tab as the current route
      refresh === 'sameTab' && (refresh = isSameTab)

      refresh && this.refresh(path, false)

      try {
        await this.$router[isReplace ? 'replace' : 'push'](path)
      } catch (e) {
      } finally {
        isSameTab && this.reload()
      }
    },

    // remove tab item
    async removeTab(id, force = false) {
      const { items } = this
      const idx = items.findIndex(item => item.id === id)

      // The last tab is not allowed to close
      if (!force && this.keepLastTab && items.length === 1) {
        throw new Error(this.langs.msg.keepLastTab)
      }

      if (!force) await this.leavePage(id, 'close')

      // Promise to remove tabs and cache after closing
      this.$alive.remove(id)
      idx > -1 && items.splice(idx, 1)
    },

    /**
     * Close tab
     * Support calling in the following ways:
     * 1. this.$tabs.close({id, path, match, force, to, refresh})
     * 2. this. $tabs. close(path, to)
     * @param {String} id close by tab id
     * @param {location} path Close the tab through the routing path, if the id and path are not configured, close the current tab
     * @param {Boolean} [match = true] When the path mode is disabled, whether to match the full path of path
     * @param {Boolean} [force = true] Whether to force close
     * @param {location} to the address to jump after closing, if it is null, it will not jump
     * @param {Boolean} [refresh = false] Whether to open the jump address newly
     */
    async close() {
      // parsing parameters
      let {
        id,
        // eslint-disable-next-line prefer-const
        path,
        // eslint-disable-next-line prefer-const
        match = true,
        // eslint-disable-next-line prefer-const
        force = true,
        to,
        // eslint-disable-next-line prefer-const
        refresh = false
      } = getCloseArgs(arguments)

      const { activeTabId, items } = this

      // get id according to path
      if (!id && path) {
        id = this.getIdByPath(path, match)
        if (!id) return
      }

      // default current tab
      if (!id) id = activeTabId

      try {
        const idx = items.findIndex(item => item.id === id)

        // remove tab
        await this.removeTab(id, force)

        // do not jump for null
        if (to === null) return

        // If the current tab is closed, open the next tab
        if (!to && activeTabId === id) {
          const nextTab = items[idx] || items[idx - 1]
          to = nextTab ? nextTab.to : this.defaultPath
        }

        if (to) {
          this.open(to, true, refresh === false ? 'sameTab' : true)
        }
      } catch (e) {
        warn(false, e)
      }
    },

    // Close the tab by the tab id
    async closeTab(id = this.activeTabId, to, force = false) {
      await this.close({ id, to, force })
    },

    /**
     * Refresh the tab through the routing address
     * @param {location} path The address that needs to be refreshed
     * @param {Boolean} [match = true] whether to match the full path of target
     * @param {Boolean} [force = true] Whether to force refresh
     */
    refresh(path, match = true, force = true) {
      const id = (path && this.getIdByPath(path, match)) || undefined
      this.refreshTab(id, force)
    },

    // Refresh the specified tab
    async refreshTab(id = this.activeTabId, force = false) {
      try {
        if (!force) await this.leavePage(id, 'refresh')
        this.$alive.refresh(id)
      } catch (e) {
        warn(false, e)
      }
    },

    /**
     * Refresh all tabs
     * @param {Boolean} [force = false] Whether to force refresh, if forced, ignore the page beforePageLeave
     */
    async refreshAll(force = false) {
      const { cache } = this.$alive
      for (const id in cache) {
        try {
          if (!force) await this.leavePage(id, 'refresh')
          this.$alive.refresh(id)
        } catch (e) {}
      }
    },

    /**
     * Reset RouterTab to default state, close all tabs and clear cached tab data
     * @param {location} [to = this.defaultPath] Jump page after reset
     */
    reset(to = this.defaultPath) {
      // traverse delete cache
      this.items.forEach(({ id }) => this.$alive.remove(id))

      // clear cache tab
      this.clearTabsStore()

      // Initial tab data
      this.initTabs()

      this.open(to, true, true)
    }
  }
}
