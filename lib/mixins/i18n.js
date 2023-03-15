import langs from '../config/lang' // language configuration
import { warn } from '../util/warn'

// globalization
export default {
  computed: {
    // language content
    langs() {
      let { lang } = this

      // Automatically identify browser language
      if (lang === 'auto') {
        lang = (navigator.language || navigator.userLanguage).substr(0, 2)
      }

      if (typeof lang === 'string') {
        lang = langs[lang]
      }

      // language configuration not found, use English
      if (!lang) lang = langs.en

      return lang
    }
  },

  methods: {
    // Get internationalized content

    i18nText(text) {
      const { key, params } = this.i18nParse(text)

      if (key) {
        const hasI18nProp = typeof this.i18n === 'function'

        // Warn if i18n method is not configured
        if (!this._hasI18nPropWarn) {
          warn(hasI18nProp, this.langs.msg.i18nProp)
          this._hasI18nPropWarn = true
        }

        if (hasI18nProp) {
          return this.i18n(key, params)
        }
      }

      return text
    },

    // Parsing internationalization
    i18nParse(text) {
      let key
      let params

      // Get internationalization configuration
      if (typeof text === 'string') {
        // String configuration: 'i18n:custom.lang.key'
        const res = /^i18n:([^\s]+)$/.exec(text)

        if (res) {
          key = res[1]
          params = []
        }
      } else if (Array.isArray(text)) {
        // Array configuration: ['tab.i18n.key', 'param1', 'param2', ...]
        ;[key, ...params] = text
      }

      return { key, params }
    }
  }
}
