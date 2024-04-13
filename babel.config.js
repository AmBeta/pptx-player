module.exports = {
  presets: [
    '@vue/app'
  ],
  // import umd module outside node_modules will be undefined.
  // https://github.com/vuejs/vue-cli/issues/2586#issuecomment-450726346
  ignore: [
    'lib/reveal.js/js/reveal.js'
  ],
}
