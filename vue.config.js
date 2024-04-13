const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  chainWebpack: (config) => {
    config.resolve.alias
      .set('reveal.js', resolve('lib/reveal.js/js/reveal.js'));
  }
};
