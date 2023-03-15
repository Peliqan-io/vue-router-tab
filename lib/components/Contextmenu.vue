<template>
  <div
    class="router-tab__contextmenu"
    :class="{ 'has-icon': hasIcon }"
    :style="{
      left: `${data.left}px`,
      top: `${data.top}px`
    }"
  >
    <tab-contextmenu-item
      v-for="item in menuList"
      :key="item.id"
      :data="item"
    />
  </div>
</template>

<script>
import TabContextmenuItem from './ContextmenuItem.vue'
import menuMap, { defaultMenu } from '../config/contextmenu'

export default {
  name: 'TabContextmenu',
  components: { TabContextmenuItem },
  inject: ['$tabs'],

  props: {
    // eslint-disable-next-line vue/require-default-prop
    data: {
      type: [Boolean, Object]
    },

    menu: {
      type: Array,
      default: () => defaultMenu
    }
  },

  computed: {
    target() {
      return this.tabMap[this.data.id]
    },

    menuList() {
      return (
        this.menu
          // eslint-disable-next-line array-callback-return
          .map(item => {
            if (typeof item === 'string') {
              return menuMap[item]
            } else if (item && item.id) {
              const origin = menuMap[item.id]
              return origin ? { ...origin, ...item } : item
            }
          })
          .filter(item => item)
      )
    },

    hasIcon() {
      return this.menuList.some(item => item.icon)
    },

    tabMap() {
      return this.$tabs.$refs.tab.reduce((map, item) => {
        map[item.id] = item
        return map
      }, {})
    },

    tabs() {
      return this.$tabs.items.map(item => this.tabMap[item.id])
    },

    lefts() {
      return this.tabs.slice(0, this.data.index).filter(item => item.closable)
    },

    rights() {
      return this.tabs.slice(this.data.index + 1).filter(item => item.closable)
    },

    others() {
      return this.tabs.filter(item => item.closable && this.data.id !== item.id)
    }
  },

  mounted() {
    this.adjust()
  },

  methods: {
    async closeMulti(tabs) {
      for (const { id } of tabs) {
        try {
          await this.$tabs.removeTab(id)
        } catch (e) {}
      }

      if (!this.$tabs.activeTab) {
        this.$router.replace(this.target.to)
      }
    },

    adjust() {
      const { clientWidth } = this.$el
      const winWidth = window.innerWidth
      if (this.data.left + clientWidth > winWidth) {
        this.data.left = winWidth - clientWidth - 5
      }
    }
  }
}
</script>
