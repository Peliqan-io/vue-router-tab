<template>
  <div class="router-alive">
    <transition
      v-bind="pageTrans"
      appear
      @after-enter="onTrans"
      @after-leave="onTrans"
    >
      <keep-alive :max="max">
        <router-view
          v-if="alive && !onRefresh"
          ref="page"
          :key="key"
          :class="pageClass"
          v-on="hooks"
          @page-loaded="onPageLoaded"
        />
      </keep-alive>
    </transition>

    <transition
      v-bind="pageTrans"
      appear
      @after-enter="onTrans"
      @after-leave="onTrans"
    >
      <router-view
        v-if="!alive && !onRefresh"
        ref="page"
        :key="key"
        :class="pageClass"
      />
    </transition>
  </div>
</template>

<script>
import { remove, mapGetters, getTransOpt, getCtorId } from '../util'
import RouteMatch from '../util/RouteMatch'

// page monitoring hook
const PAGE_HOOKS = [
  'created',
  'mounted',
  'activated',
  'deactivated',
  'destroyed'
]

/**
 * Route Cache Control
 */
export default {
  name: 'RouterAlive',

  provide() {
    // Provide an instance to the child component to call
    return {
      RouterAlive: this
    }
  },

  props: {
    // Whether to enable caching by default
    keepAlive: {
      type: Boolean,
      default: false
    },

    // Whether to reuse routing components
    reuse: {
      type: Boolean,
      default: false
    },

    // The maximum number of caches, 0 is unlimited
    max: {
      type: Number,
      default: 0
    },

    // page class
    pageClass: {
      type: [Array, Object, String],
      default: 'router-alive-page'
    },

    // Page Scroll Element Selector
    pageScroller: {
      type: String,
      default: ''
    },

    // transition effect
    // eslint-disable-next-line vue/require-default-prop
    transition: {
      type: [String, Object]
    }
  },

  data() {
    // cache record
    this.cache = {}

    return {
      // route matching information
      routeMatch: new RouteMatch(this),

      // Page Routing Index
      routeIndex: this.getRouteIndex(),

      // Is it being updated
      onRefresh: false
    }
  },

  computed: {
    // 从 this.routeMatch Is it being updated
    ...mapGetters('routeMatch', [
      'key',
      'meta',
      'nest',
      'alive',
      'reusable',
      'basePath',
      'alivePath'
    ]),

    // Listen to subpage hooks
    hooks() {
      return PAGE_HOOKS.reduce((events, hook) => {
        events['hook:' + hook] = () => this.pageHook(hook)
        return events
      }, {})
    },

    // Listen to subpage hooks
    pageTrans() {
      return getTransOpt(this.transition)
    }
  },

  watch: {
    // 监听路由
    $route: {
      handler($route, old) {
        // component ready
        if (!old) this.$emit('ready', this)

        if (!$route.matched.length) return

        const { key, alive, reusable, alivePath, nest } = this
        const cacheItem = this.cache[key] || {}
        let {
          alivePath: cacheAlivePath,
          // eslint-disable-next-line prefer-const
          fullPath: cacheFullPath,
          // eslint-disable-next-line prefer-const
          vm: cacheVM
        } = cacheItem

        // Clean up the component cache if it is not reused and the route changes
        if (cacheAlivePath && !reusable && cacheAlivePath !== alivePath) {
          cacheAlivePath = ''
          this.refresh(key)
        }

        // Nested routing, the address is inconsistent with the cache
        if (nest && cacheVM && $route.fullPath !== cacheFullPath) {
          const oldKey = this.matchRoute(old).key
          if (oldKey !== key) {
            this.nestForceUpdate = true
          }
        }

        // Type: update or new cache
        const type = cacheAlivePath ? 'update' : 'create'

        this.$emit('change', type, this.routeMatch)

        // update cache path
        if (alive) {
          cacheItem.fullPath = $route.fullPath
        }
      },

      immediate: true
    }
  },

  mounted() {
    // Get the keepAlive component instance
    this.$refs.alive = this._vnode.children[0].child._vnode.componentInstance
  },

  // cleanup after destruction
  destroyed() {
    this.cache = null
    this.routeMatch = null
    this._match = null
    this.$refs.alive = null
  },

  methods: {
    // Get page routing index
    getRouteIndex() {
      let cur = this
      let depth = -1 // routing depth

      while (cur && depth < 0) {
        const { data } = cur.$vnode || {}
        if (data && data.routerView) {
          depth = data.routerViewDepth
        } else {
          cur = cur.$parent
        }
      }

      return depth + 1
    },

    // remove cache
    remove(key = this.key) {
      const $alive = this.$refs.alive

      if (!$alive) return

      const cacheItem = this.cache[key]
      const { cache, keys } = $alive

      // Destroy the cache component instance and clear the RouterAlive cache records
      if (cacheItem) {
        cacheItem.vm.$destroy()
        cacheItem.vm = null
        this.cache[key] = null
      }

      // Clean up keepAlive cache records
      // eslint-disable-next-line array-callback-return
      Object.entries(cache).find(([id, item]) => {
        const vm = item?.componentInstance
        if (vm?.$vnode?.data?.key === key) {
          // destroy component instance
          vm.$destroy()

          cache[id] = null
          remove(keys, id)

          return true
        }
      })
    },

    // destroy component instance
    refresh(key = this.key) {
      this.remove(key)

      // Not the current cache, remove it directly
      if (key === this.key) {
        this.reload()
      }
    },

    // Reload
    reload() {
      if (this.onRefresh) return

      this.onRefresh = true
    },

    // Cache page component hook
    pageHook(hook) {
      const handler = this[`pageHook:${hook}`]
      if (typeof handler === 'function') handler()
    },

    // page creation
    'pageHook:created'() {
      this.cache[this.key] = {
        alivePath: this.alivePath,
        fullPath: this.$route.fullPath
      }
    },

    // page mount
    'pageHook:mounted'() {
      this.cache[this.key].vm = this.$refs.page

      // reset initial scroll position
      this.resetScrollPosition()
    },

    // page activation
    'pageHook:activated'() {
      const pageVm = this.$refs.page

      // hot reload update
      if (this.checkHotReloading()) return

      // Forced updates when nested route caches result in page mismatches
      if (this.nestForceUpdate) {
        delete this.nestForceUpdate
        pageVm.$forceUpdate()
      }

      // restore scroll position
      this.restoreScrollPosition()
    },

    // page deactivation
    'pageHook:deactivated'() {
      if (this.checkHotReloading()) return

      // save scroll position
      this.saveScrollPosition()
    },

    // Clean up after page destruction cache
    async 'pageHook:destroyed'() {
      await this.$nextTick()

      if (!this.cache) return

      // Clear cached information for destroyed pages
      Object.entries(this.cache).forEach(([key, item]) => {
        const { vm } = item || {}
        if (vm && vm._isDestroyed) {
          this.remove(key)
        }
      })
    },

    // End refresh state after page transition
    onTrans() {
      if (this.onRefresh) {
        this.onRefresh = false
        this.$emit('change', 'create', this.routeMatch)
      }
    },

    // Match routing information
    matchRoute($route) {
      const matched = this._match

      // Match routing information
      if (
        $route === this.$route ||
        $route.fullPath === this.$route.fullPath ||
        $route === this.$route.fullPath
      ) {
        return this.routeMatch
      }

      if (matched) {
        matched.$route = $route
        return matched
      }

      return (this._match = new RouteMatch(this, $route))
    },

    // Detect hot reload
    checkHotReloading() {
      const pageVm = this.$refs.page
      const lastCid = pageVm._lastCtorId
      const cid = (pageVm._lastCtorId = getCtorId(pageVm))

      // hot reload update
      if (lastCid && lastCid !== cid) {
        this.refresh()
        return true
      }

      return false
    },

    // Get the scroll element
    getScroller(selector) {
      return selector.startsWith('$')
        ? document.querySelector(selector.replace(/^\$/, ''))
        : this.$el.querySelector(selector)
    },

    // Get the scroll element
    saveScrollPosition() {
      const pageVm = this.$refs.page

      if (!pageVm) return

      // Scrolling elements configured inside the page
      let { pageScroller } = pageVm.$vnode.componentOptions.Ctor.options

      if (typeof pageScroller === 'string' && pageScroller.length) {
        pageScroller = pageScroller.split(/\s?,\s?/)
      }

      if (!Array.isArray(pageScroller)) {
        pageScroller = []
      }

      // Save the page root node position by default
      pageScroller.push('.' + this.pageClass)

      // Add global scroll element configuration
      // Component external selectors use the $ prefix to distinguish
      if (this.pageScroller) {
        pageScroller.push('$' + this.pageScroller)
      }

      // record location
      const position = pageScroller.reduce((pos, selector) => {
        const el = this.getScroller(selector)

        if (el) {
          pos[selector] = {
            left: el.scrollLeft,
            top: el.scrollTop
          }
        }

        return pos
      }, {})

      pageVm._pageScrollPosition = position
    },

    // restore scroll position
    restoreScrollPosition() {
      const pageVm = this.$refs.page
      const position = pageVm?._pageScrollPosition

      if (!position) return

      Object.entries(position).forEach(([selector, pos]) => {
        const el = this.getScroller(selector)
        if (el) {
          el.scrollLeft = pos.left
          el.scrollTop = pos.top
        }
      })
    },

    // reset global scroll position
    resetScrollPosition() {
      if (!this.pageScroller) return

      const el = this.getScroller('$' + this.pageScroller)

      if (!el) return

      el.scrollLeft = 0
      el.scrollTop = 0
    },

    // Page data loaded successfully
    async onPageLoaded() {
      await this.$nextTick()
      // Restore the scroll position after the page data is loaded successfully
      this.restoreScrollPosition()
    }
  }
}
</script>
