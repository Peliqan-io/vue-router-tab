import { emptyObj } from '../util'

// Routing Navigation Guard
export const leaveGuard = router => (to, from, next) => {
  const { $tabs } = router.app

  if (!$tabs) {
    next()
    return
  }

  const fromId = $tabs.getRouteKey(from)
  const toId = $tabs.getRouteKey(to)
  const { $alive } = $tabs
  const fromCache = $alive && $alive.cache[fromId]
  const { alivePath } = ($alive && $alive.cache[toId]) || emptyObj
  const matched = $tabs.matchRoute(to)

  let id, type

  if (alivePath && alivePath !== matched.alivePath) {
    type = 'replace'
    id = toId
  } else if ($alive.basePath !== matched.basePath) {
    type = 'leave'
    id = $tabs.activeTabId
  } else if (!fromCache && fromId !== toId) {
    type = 'leave'
    id = $tabs.activeTabId
  }

  if (type) {
    $tabs
      .leavePage(id, type)
      .then(next)
      .catch(() => next(false))
  } else {
    next()
  }
}

// page leave
export default {
  created() {
    const { $router } = this

    if ($router._RouterTabInit) return

    // Initialize routing and navigation guards
    $router.beforeEach(leaveGuard($router))
    $router._RouterTabInit = true
  },

  methods: {
    // page leaves Promise
    // eslint-disable-next-line require-await
    async leavePage(id, type) {
      const tab = this.items.find(item => item.id === id) // current tab
      let { vm } = this.$alive.cache[id] || emptyObj // cache data

      // When the cache is not enabled, get the current page component instance
      if (!vm && this.activeTabId === id) {
        try {
          vm = this.$route.matched[this.$alive.routeMatch.routeIndex].instances
            .default
        } catch (_) {
          vm = null
        }
      }

      if (!vm || !tab) return

      const pageLeave = vm.$vnode.componentOptions.Ctor.options.beforePageLeave

      if (typeof pageLeave === 'function') {
        // Before the tab is closed
        return pageLeave.bind(vm)(tab, type)
      }
    }
  }
}
