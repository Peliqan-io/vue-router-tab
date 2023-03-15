import RouterTab from './RouterTab.vue'
import RouterAlive from './components/RouterAlive.vue'
import RouterTabRoutes, { Iframe } from './config/routes'
import routerPage from './mixins/routerPage'

import './scss/transition.scss'
import './scss/routerTab.scss'

// Install
RouterTab.install = function install(Vue) {
  if (install.installed) return

  RouterTab.Vue = Vue
  install.installed = true

  Vue.component(RouterTab.name, RouterTab)
  Vue.mixin(routerPage)
}

// If the browser environment has a global Vue, the component is automatically installed
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(RouterTab)
}

export default RouterTab

// export
export { RouterAlive, RouterTabRoutes, Iframe }
