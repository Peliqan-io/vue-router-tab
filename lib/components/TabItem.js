import { mapGetters } from '../util'

// Drag and drop transfer data prefix
const TRANSFER_PREFIX = 'RouterTabDragSortIndex:'

// sort drag data
// To solve the problem of not being able to obtain data through dataTransfer.getData in dual-core browser compatibility mode // Sort and drag data
let dragSortData = null

// @vue/component
export default {
  name: 'TabItem',
  inject: ['$tabs'],

  props: {
    // Tab original data, convenient for slot slot to customize data
    data: {
      type: Object,
      required: true
    },

    // eslint-disable-next-line vue/require-default-prop
    index: Number
  },

  data() {
    return {
      onDragSort: false, // is dragging
      isDragOver: false // Whether to drag through
    }
  },

  computed: {
    // extract computed property from this.data
    ...mapGetters('data', ['id', 'to', 'icon', 'tabClass', 'target', 'href']),

    // class
    classList() {
      return [
        'router-tab__item',
        this.tabClass,
        {
          'is-active': this.$tabs.activeTabId === this.id,
          'is-closable': this.closable,
          'is-contextmenu': this.$tabs.contextData.id === this.id,
          'is-drag-over': this.isDragOver && !this.onDragSort
        }
      ]
    },

    i18nText() {
      return this.$tabs.i18nText
    },

    untitled() {
      return this.$tabs.langs.tab.untitled
    },

    title() {
      return this.i18nText(this.data.title) || this.untitled
    },

    tips() {
      return this.i18nText(this.data.tips || this.data.title) || this.untitled
    },

    closable() {
      const { keepLastTab, items } = this.$tabs
      return this.data.closable !== false && !(keepLastTab && items.length < 2)
    }
  },

  methods: {
    // Slot default content
    slotDefault() {
      return [
        this.icon && <i class={['router-tab__item-icon', this.icon]} />,
        <span class="router-tab__item-title" title={this.tips}>
          {this.title}
        </span>,
        this.closable && (
          <i
            class="router-tab__item-close"
            vOn:click_prevent_stop={this.close}
          />
        )
      ]
    },

    close() {
      this.$tabs.closeTab(this.id)
    },

    onDragStart(e) {
      this.onDragSort = this.$tabs.onDragSort = true
      dragSortData = TRANSFER_PREFIX + this.index
      e.dataTransfer.setData('text', dragSortData)
      e.dataTransfer.effectAllowed = 'move'
    },

    onDragOver(e) {
      this.isDragOver = true
      e.dataTransfer.dropEffect = 'move'
    },

    onDragEnd() {
      this.onDragSort = this.$tabs.onDragSort = false
      dragSortData = null
    },

    onDrop(e) {
      const { items } = this.$tabs
      const raw = e.dataTransfer.getData('text') || dragSortData

      this.isDragOver = false

      if (typeof raw !== 'string' || !raw.startsWith(TRANSFER_PREFIX)) return

      const fromIndex = raw.replace(TRANSFER_PREFIX, '')
      const tab = items[fromIndex]

      items.splice(fromIndex, 1)
      items.splice(this.index, 0, tab)
    }
  },

  // render component
  // Use the jsx render mode to replace the template to avoid errors caused by Vue 2.5.22 version not supporting child components using parent component slots.
  render() {
    const { default: slot = this.slotDefault } = this.$tabs.$scopedSlots

    return (
      <RouterLink
        custom
        to={this.to}
        scopedSlots={{
          default: ({ navigate }) => {
            return (
              <li
                class={this.classList}
                draggable={this.$tabs.dragsort}
                vOn:click={navigate}
                vOn:dragstart={this.onDragStart}
                vOn:dragend={this.onDragEnd}
                vOn:dragover_prevent={this.onDragOver}
                vOn:dragleave_prevent={() => (this.isDragOver = false)}
                vOn:drop_stop_prevent={this.onDrop}
                vOn:click_middle={() => this.closable && this.close()}
              >
                {slot(this)}
              </li>
            )
          }
        }}
      ></RouterLink>
    )
  }
}
