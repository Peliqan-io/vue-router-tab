// empty objects and arrays
export const emptyObj = Object.create(null)
export const emptyArray = []

// remove item from array
export function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Scroll to the specified position
 * @export
 * @param {Element} wrap scroll area
 * @param {number} [left=0]
 * @param {number} [top=0]
 */
export function scrollTo({ wrap, left = 0, top = 0, smooth = true }) {
  if (!wrap) return

  if (wrap.scrollTo) {
    wrap.scrollTo({
      left,
      top,
      behavior: smooth ? 'smooth' : 'auto'
    })
  } else {
    wrap.scrollLeft = left
    wrap.scrollTop = top
  }
}

/**
 * The specified element scrolls to the visible area
 * @export
 * @param {Element} el target element
 * @param {Element} wrap scroll area
 * @param {String} block vertical alignment, optional: 'start', 'center', 'end', or 'nearest'
 * @param {String} inline Horizontal alignment, the optional value is the same as above
 */
export function scrollIntoView({
  el,
  wrap,
  block = 'start',
  inline = 'nearest'
}) {
  if (!el || !wrap) return

  if (el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block, inline })
  } else {
    // eslint-disable-next-line prefer-const
    let { offsetLeft, offsetTop } = el
    let left, top

    if (block === 'center') {
      top = offsetTop + (el.clientHeight - wrap.clientHeight) / 2
    } else {
      top = offsetTop
    }

    if (inline === 'center') {
      left = offsetLeft + (el.clientWidth - wrap.clientWidth) / 2
    } else {
      left = offsetLeft
    }

    scrollTo({ wrap, left, top })
  }
}

// get scrollbar width
export const getScrollbarWidth = (function() {
  let width = null

  return function() {
    if (width !== null) return width

    const div = document.createElement('div')

    div.style.cssText = 'width: 100px; height: 100px;overflow-y: scroll'
    document.body.appendChild(div)
    width = div.offsetWidth - div.clientWidth
    div.parentElement.removeChild(div)

    return width
  }
})()

/**
 * Extract computed properties
 * @export
 * @param {String} origin source attribute
 * @param {Array|Object} props Computed properties to extract
 * @param {String} The input parameter when the context source option is function
 * @returns {Object}
 */
export function mapGetters(origin, props, context) {
  const map = {}

  const each = (prop, option) => {
    if (option === null || typeof option !== 'object') {
      option = { default: option }
    }

    const { default: def, alias } = option

    map[alias || prop] = function() {
      const val = this[origin][prop]
      if (context && typeof val === 'function') {
        // function return
        return val(this[context])
      } else if (def !== undefined && val === undefined) {
        // Defaults
        if (typeof def === 'function') {
          return def.bind(this)()
        }
        return def
      }
      return val
    }
  }

  if (Array.isArray(props)) {
    props.forEach(prop => each(prop))
  } else {
    Object.entries(props).forEach(([prop, def]) => each(prop, def))
  }

  return map
}

// remove the hash from the path
export const prunePath = path => path.split('#')[0]

// parse the transition configuration
export function getTransOpt(trans) {
  return typeof trans === 'string' ? { name: trans } : trans
}

// get component id
export function getCtorId(vm) {
  return vm.$vnode.componentOptions.Ctor.cid
}
