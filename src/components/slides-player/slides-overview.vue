<template>
  <div class="slides-overview" @click="handleClose">
    <ul class="slide-list">
      <li v-for="(slide, index) in slides" :key="index"
        :class="['slide-item', { 'is-current': slideNo === index }]"
        @click="handleSelect(index)"
      >
        <div class="slide-content">
          <slide-preview :slide="slide"></slide-preview>
        </div>
        <span class="slide-index">{{index + 1}}</span>
      </li>
    </ul>
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

    slideNo: {
      type: Number,
      default: 0,
    },
  },

  methods: {
    handleSelect(index) {
      this.$emit('jump', index);
    },

    handleClose() {
      this.$emit('close');
    },
  },
}
</script>

<style lang="scss" scoped>
.slides-overview {
  position: relative;
  width: 100%;
  height: 100%;
  color: #fff;
  background: rgba($color: #2f2f2f, $alpha: .3);
  z-index: 99;
  box-sizing: border-box;
  padding: 20px 40px 100px;

  .slide-list {
    position: relative;
    overflow: scroll;
    height: 100%;
    &:-webkit-scrollbar {
      display: none;
    }

    .slide-item {
      cursor: pointer;
      position: relative;
      display: block;
      margin: 15px 20px;
      float: left;
      transition: all .2s;
      border-radius: 5px;
      overflow: hidden;
      &:hover {
        box-shadow: 0 0 20px #fff;
      }
      &.is-current {
        box-shadow: 0 0 0 3px #FFE577;
      }

      .slide-content {
        transform-origin: top;
      }
      .slide-index {
        position: absolute;
        left: 2px;
        bottom: 2px;
        width: 20px;
        height: 20px;
        font-size: 14px;
        text-align: center;
        line-height: 20px;
        color: #fff;
        background-color: #72BDBA;
        border-radius: 100%;
      }
    }
  }
}
</style>

