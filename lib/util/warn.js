const prefix = '[Vue Router Tab]'

// mistake
export function assert(condition, message) {
  if (!condition) {
    throw new Error(`${prefix} ${message}`)
  }
}

// warn
export function warn(condition, message) {
  if (!condition) {
    typeof console !== 'undefined' && console.warn(`${prefix} ${message}`)
  }
}

// Common news
export const messages = {
  renamed(newName, target = 'method') {
    return `The ${target} has been renamed to "${newName}", please use after modification`
  }
}
