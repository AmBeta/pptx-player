<template>
  <div class="slide-preview" v-html="slide.html" :style="`${styleSize}${styleTransform}`">
    Slide Preview
  </div>
</template>

<script>
export default {
  props: {
    slide: {},
    size: {
      type: Object,
      default: () => ({
        width: 256,
        height: 144,
      }),
    },
  },

  computed: {
    styleSize() {
      const { width, height } = this.size;
      return `width:${width}px;height:${height}px;`;
    },

    styleTransform() {
      const { width, height } = this.slide.size;
      const scaleX = this.size.width / width;
      const scaleY = this.size.height / height;
      const translateX = (scaleX - 1) / (2 * scaleX);
      return `transform:scaleX(${scaleX}) scaleY(${scaleY}) translateX(${translateX * 100}%);`
        + 'transform-origin:top';
    },
  },
}
</script>
