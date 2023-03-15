// menu data
const menuMap = {
  // refresh
  refresh: {
    handler({ data, $tabs }) {
      $tabs.refreshTab(data.id)
    }
  },

  // refresh all
  refreshAll: {
    handler({ $tabs }) {
      $tabs.refreshAll()
    }
  },

  // closure
  close: {
    enable({ target }) {
      return target.closable
    },
    handler({ data, $tabs }) {
      $tabs.closeTab(data.id)
    }
  },

  // close the left
  closeLefts: {
    enable({ $menu }) {
      return $menu.lefts.length
    },
    handler({ $menu }) {
      $menu.closeMulti($menu.lefts)
    }
  },

  // close the right side
  closeRights: {
    enable({ $menu }) {
      return $menu.rights.length
    },
    handler({ $menu }) {
      $menu.closeMulti($menu.rights)
    }
  },

  // close other
  closeOthers: {
    enable({ $menu }) {
      return $menu.others.length
    },
    handler({ $menu }) {
      $menu.closeMulti($menu.others)
    }
  }
}

// iterate through the filled ids
Object.entries(menuMap).forEach(([id, item]) => (item.id = id))

export default menuMap

// default menu
export const defaultMenu = [
  'refresh',
  'refreshAll',
  'close',
  'closeLefts',
  'closeRights',
  'closeOthers'
]
