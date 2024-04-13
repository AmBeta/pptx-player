<template>
  <span class="icon" v-html="iconSVG"
    :style="`${iconSize}${iconColor}`"
  ></span>
</template>

<script>
import { ICON_SVG } from './icon-svg';

export default {
  name: 'Icon',

  props: {
    type: String,
    size: {
      type: Number,
      default: 20,
    },
    color: {
      type: String,
      default: 'black',
    },
  },

  computed: {
    iconSVG() {
      return ICON_SVG[this.type];
    },

    iconSize() {
      return `width:${this.size}px;height:${this.size}px;`;
    },

    iconColor() {
      return `fill:${this.color};`;
    },
  },
}
</script>

<style lang="scss" scoped>
.icon {
  display: inline-block;
}
</style>
