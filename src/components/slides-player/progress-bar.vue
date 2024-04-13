<template>
  <div class="progress-bar">
    <div class="current-progress" :style="progressStyle"></div>
    <div class="hotspot-list">
      <div v-for="(slide, index) in slides" :key="index"
        :class="['hotspot-item', { 'is-current': index === slideNo }]"
        @click="handleHotspotClick(index)"
      >
        <div v-if="showPreview" class="hotspot-preview">
          <slide-preview :slide="slide"></slide-preview>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SlidePreview from './slide-preview';

export default {
  components: { SlidePreview },

  props: {
    slides: {
      type: Array,
      default: () => [],
    },
    /** 当前页面序号 */
    slideNo: {
      type: Number,
      default: 0,
    },
    /** 是否显示预览 */
    showPreview: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {};
  },

  computed: {
    slidesCount() {
      return this.slides.length;
    },

    progressStyle() {
      let right = 0;
      if (this.slideNo !== this.slidesCount - 1) {
        const segCount = this.slidesCount + 1;
        const slideNo = this.slidesCount && this.slideNo + 1;
        right = 100 * (segCount - slideNo) / segCount;
      }

      return `right:${right}%`;
    },
  },

  methods: {
    handleHotspotClick(slideIndex) {
      this.$emit('jump', slideIndex);
    },
  },
}
</script>

<style lang="scss" scoped>
.progress-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background-color: #000;
  transition: all .2s;
  z-index: 99; // 确保热点预览浮动在上层
  &:before {
    content: ' ';
    position: absolute;
    top: 9px;
    height: 2px;
    width: 100%;
    background-color: #515151;
  }

  .current-progress {
    position: absolute;
    top: 9px;
    left: 0;
    height: 2px;
    background-color: #72BDBA;
    transition: all .3s;
  }

  .hotspot-list {
    position: absolute;
    top: 6px;
    width: 100%;
    display: flex;
    justify-content: space-evenly;
    .hotspot-item {
      position: relative;
      cursor: pointer;
      width: 8px;
      height: 8px;
      background-color: #72BDBA;
      border-radius: 100%;
      &.is-current {
        background-color: #FFE577;
      }

      .hotspot-preview {
        display: none;
        position: absolute;
        bottom: 14px;
        transform: translateX(-45%);
        overflow: hidden;
        box-shadow: 0 0 5px #ddd;
      }
      &:hover {
        .hotspot-preview {
          display: block;
        }
      }
    }
  }
}
</style>
