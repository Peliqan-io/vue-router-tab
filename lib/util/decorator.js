/* decorator */

/**
 * anti shake
 * @param {number} [delay=200] Delay
 */
export const debounce = (delay = 200) => (target, name, desc) => {
  const fn = desc.value
  let timeout = null

  desc.value = function(...rest) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn.call(context, ...rest)
    }, delay)
  }
}
