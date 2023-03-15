import { emptyObj, prunePath, getTransOpt } from './util'
import contextmenu from './mixins/contextmenu'
import i18n from './mixins/i18n'
import iframe from './mixins/iframe'
import operate from './mixins/operate'
import pageLeave from './mixins/pageLeave'
import scroll from './mixins/scroll'
import restore from './mixins/restore'

// 子组件
import RouterAlive from './components/RouterAlive.vue'
import TabItem from './components/TabItem'
import TabScroll from './components/TabScroll.vue'
import TabContextmenu from './components/Contextmenu.vue'

// RouterTab components
// @vue/component
const RouterTab = {
  name: 'RouterTab',
  components: { RouterAlive, TabItem, TabScroll, TabContextmenu },
  mixins: [contextmenu, i18n, iframe, operate, pageLeave, scroll, restore],

  // Inject child components
  provide() {
    return { $tabs: this }
  },

  props: {
    // Initial tab data
    tabs: {
      type: Array,
      default: () => []
    },

    // Whether to restore the tab after the page is refreshed
    restore: {
      type: [Boolean, String],
      default: false
    },

    // Whether to monitor restoreKey changes and automatically restore tabs
    restoreWatch: {
      type: Boolean,
      default: false
    },

    // Page Scroll Element Selector
    pageScroller: {
      type: String,
      default: '.router-tab__container'
    },

    // default page
    defaultPage: [String, Object],

    // Tab transition effect
    tabTransition: {
      type: [String, Object],
      default: 'router-tab-zoom'
    },

    // page transition effect
    pageTransition: {
      type: [String, Object],
      default: () => ({
        name: 'router-tab-swap',
        mode: 'out-in'
      })
    },

    /**
     * Customize right-click menu
     * 1. Disabled when false
     * 2. You can customize the right-click menu when it is an array
     */
    contextmenu: {
      type: [Boolean, Array],
      default: true
    },

    // Whether to support tab drag and drop sorting
    dragsort: {
      type: Boolean,
      default: true
    },

    // The insertion position of the new tab, last at the end, next next
    append: {
      type: String,
      default: 'last'
    },

    // Whether to keep the last tab from being closed
    keepLastTab: {
      type: Boolean,
      default: true
    },

    // Whether to cache by default, it can be reset by routing meta.keepAlive
    keepAlive: {
      type: Boolean,
      default: true
    },

    // The maximum number of caches, 0 is unlimited
    maxAlive: {
      type: Number,
      default: 0
    },

    // Whether to reuse routing components, which can be reset by routing meta.reuse
    reuse: {
      type: Boolean,
      default: false
    },

    // Tab internationalization configuration i18n (key, [args])
    i18n: Function,

    /**
     * Component language
     * - When it is a string, optional values: 'zh'-Chinese, 'en'-English
     * - When it is an object, you can set a custom language
     * - Default: 'auto'. Automatically identify component language based on browser language.
     */
    lang: {
      type: [String, Object],
      default: 'auto'
    }
  },

  data() {
    return {
      items: [], // tab item
      onDragSort: false, // Drag and drop sorting
      aliveReady: false // RouterAlive initialization
    }
  },

  computed: {
    // routerAlive
    $alive() {
      return this.aliveReady ? this.$refs.routerAlive : null
    },

    // currently active tab id
    activeTabId() {
      return this.$alive ? this.$alive.key : null
    },

    // Currently active tab index
    activeTabIndex() {
      return this.items.findIndex(item => item.id === this.activeTabId)
    },

    // currently active tab
    activeTab() {
      return this.items[this.activeTabIndex]
    },

    // currently active tab
    basePath() {
      return this.$alive ? this.$alive.basePath : '/'
    },

    // default path
    defaultPath() {
      return this.defaultPage || this.basePath || '/'
    },

    // Tab transition
    tabTrans() {
      return getTransOpt(this.tabTransition)
    },

    // page transition
    pageTrans() {
      return getTransOpt(this.pageTransition)
    }
  },

  created() {
    // page transition
    RouterTab.Vue.prototype.$tabs = this
  },

  destroyed() {
    const proto = RouterTab.Vue.prototype
    // Cancel prototype mount
    if (proto.$tabs === this) {
      proto.$tabs = null
    }
  },

  methods: {
    // RouterAlive component ready
    onAliveReady($alive) {
      // Get the keepAlive component instance
      this.$refs.routerAlive = $alive
      this.aliveReady = true
      this.initTabs()
    },

    // Initial tab data
    initTabs() {
      if (this.restoreTabs()) return

      this.presetTabs()
    },

    // Default tab
    presetTabs(tabs = this.tabs) {
      const ids = {}

      this.items = tabs
        // eslint-disable-next-line array-callback-return
        .map(item => {
          item = typeof item === 'string' ? { to: item } : item || emptyObj

          const matched = item.to && this.matchRoute(item.to)

          if (matched) {
            const tab = this.getRouteTab(matched)
            const id = tab.id

            // Deduplication based on id
            if (!ids[id]) {
              // id is not allowed to change
              delete item.id

              // initial tab data
              return (ids[id] = Object.assign(tab, item))
            }
          }
        })
        .filter(item => !!item)
    },

    // Change the tab synchronously when the RouterAlive cache is updated
    onAliveChange(type, matched) {
      const { items, lastMatchedKey } = this
      const { key } = matched
      const matchIdx = items.findIndex(({ id }) => id === key)
      const item = this.getRouteTab(matched)

      // Tab already exists
      if (matchIdx > -1) {
        if (
          type === 'create' || // create cache
          (type === 'update' && items[matchIdx].to !== matched.$route.fullPath) // update cache and address change
        ) {
          // Replace the original tab
          this.$set(items, matchIdx, item)
        }
      } else {
        // New tab
        // eslint-disable-next-line no-lonely-if
        if (this.append === 'next' && lastMatchedKey !== undefined) {
          const lastIndex = this.items.findIndex(
            item => item.id === lastMatchedKey
          )
          items.splice(lastIndex + 1, 0, item)
        } else {
          items.push(item)
        }
      }

      // last cached key
      this.lastMatchedKey = key
    },

    // get tab configuration from route
    getRouteTab({ key, $route, meta }) {
      const tab = { ...meta }

      // Support the tab attribute returned by the routing function
      const props = ['title', 'tips', 'icon', 'closable']

      for (const i in tab) {
        if (props.includes(i)) {
          const val = tab[i]
          if (typeof val === 'function') {
            tab[i] = val($route)
          }
        }
      }

      return Object.assign(tab, {
        id: key,
        to: $route.fullPath
      })
    },

    // Overload routing view
    async reload() {
      await this.$alive.reload()
    },

    // Match routing information
    matchRoute($route) {
      return this.$alive.matchRoute($route)
    },

    // Get route cache key
    getRouteKey(route = this.$route) {
      return this.matchRoute(route).key
    },

    // From the route address matching tab id
    getIdByPath(path, match = true) {
      if (!path) return

      const matched = this.matchRoute(path)
      const { key } = matched

      if (match) {
        // Routing Address Exact Match Tab
        const matchTab = this.items.find(
          ({ to }) => prunePath(to) === prunePath(matched.$route.fullPath)
        )

        if (matchTab) {
          return key
        }
      }

      return key
    }
  }
}

export default RouterTab
