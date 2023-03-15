import { prunePath } from './'
import rules from '../config/rules'

// resolve route key
function parseRouteKey($route, route, key) {
  const defaultKey = route.path

  if (!key) return defaultKey

  if (typeof key === 'string') {
    // rule
    const rule = rules[key.toLowerCase()]
    return rule ? rule($route) : key
  }

  if (typeof key === 'function') {
    return parseRouteKey($route, route, key($route))
  }

  return defaultKey
}

// resolve matching paths
function parsePath(path, params) {
  return Object.entries(params).reduce((p, [key, val]) => {
    return p.replace(':' + key, val)
  }, path)
}

// Match Routing Data
export default class RouteMatch {
  constructor(vm, $route) {
    this.vm = vm
    this.$route = $route
  }

  // set routing
  set $route($route) {
    if ($route && !$route.matched) {
      const { $router } = this.vm
      $route = $router.match($route, $router.currentRoute)
    }
    this._$route = $route
  }

  // get route
  get $route() {
    return this._$route || this.vm.$route
  }

  // Page Routing Index
  get routeIndex() {
    return this.vm.routeIndex
  }

  // Subordinate routing
  get route() {
    return this.$route.matched[this.routeIndex]
  }

  // root path
  get basePath() {
    if (this.routeIndex < 1) return '/'

    const baseRoute = this.$route.matched[this.routeIndex - 1] || {}
    const { path } = baseRoute

    return (path && parsePath(path, this.$route.params)) || '/'
  }

  // Cache path, used to determine whether to reuse
  get alivePath() {
    const { $route } = this
    // 嵌套路由
    if (this.nest) {
      return parsePath(this.route.path, $route.params)
    }

    return prunePath($route.fullPath)
  }

  // nested routes
  get meta() {
    const {
      route,
      vm: { $nuxt }
    } = this

    // Nuxt gets meta from page configuration first
    if ($nuxt) {
      try {
        const { meta: metas = [] } = $nuxt.context.route
        const meta = metas[this.routeIndex]
        if (meta && Object.keys(meta).length) {
          return meta
        }
      } catch (e) {
        console.error(e)
      }
    }

    return (route && route.meta) || {}
  }

  // Whether to nest routes
  get nest() {
    return this.$route.matched.length > this.routeIndex + 1
  }

  // routing key
  get key() {
    if (!this.route) return ''

    return parseRouteKey(this.$route, this.route, this.meta.key)
  }

  // Whether to cache
  get alive() {
    const { keepAlive } = this.meta
    return typeof keepAlive === 'boolean' ? keepAlive : this.vm.keepAlive
  }

  // Whether to reuse components
  get reusable() {
    const { reuse } = this.meta
    return typeof reuse === 'boolean' ? reuse : this.vm.reuse
  }
}
