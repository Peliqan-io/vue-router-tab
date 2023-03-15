// Import the language configuration under the directory
const context = require.context('./', false, /^((?!index).)*\.js$/)

// language configuration
export default context.keys().reduce((map, path) => {
  // eslint-disable-next-line prefer-const
  let [, key] = /\.\/(.*).js/g.exec(path)
  map[key] = context(path).default
  return map
}, {})
