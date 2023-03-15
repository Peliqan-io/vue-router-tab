import { prunePath } from '../util'

// built-in rules
export default {
  // Address, params inconsistent cache independently
  path: route => route.path,

  // Complete address (ignore hash), if params or query are inconsistent, cache independently
  fullpath: route => prunePath(route.fullPath)
}
