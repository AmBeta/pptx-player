<template>
  <div :class="['control-bar', { 'is-embedded': embedded }]">
    <div v-for="(buttonGroup, index) in buttons" :key="index" class="control-group">
      <span v-for="button in buttonGroup" :key="button.key" class="control-button"
        :title="button.title || button.label"
        @click="handleClick(button.key)"
      >
        <icon v-if="button.icon" :type="button.icon" :size="embedded ? 20 : 32" color="#fff"></icon>
        {{typeof button.label === 'function' ? button.label({ slideNo, slidesCount }) : button.label}}
      </span>
    </div>
  </div>
</template>

<script>
import { CONTROL_BUTTONS, CTRL_OVERVIEW, CTRL_PAGER, CTRL_FULLSCREEN } from './config';
import Icon from '../icon';

export default {
  components: { Icon },

  props: {
    slideNo: {
      type: Number,
      default: 0,
    },
    slidesCount: {
      type: Number,
      default: 0,
    },
    embedded: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    buttons() {
      let buttons = CONTROL_BUTTONS;
      if (!document.documentElement.requestFullscreen) {
        // feature detection: hide fullscreen button when not supported
        buttons = buttons.filter(
          btnGrp => btnGrp.filter(btn => btn.key !== CTRL_FULLSCREEN)
        );
      }
      if (this.embedded) {
        // hide overview button in embedded mode
        return buttons.map(
          btnGrp => btnGrp.filter(btn => btn.key !== CTRL_OVERVIEW)
        );
      }
      return buttons;
    },
  },

  methods: {
    handleClick(type) {
      if (this.embedded && type === CTRL_PAGER) return;
      this.$emit('command', type);
    },
  },
}
</script>

<style lang="scss" scoped>
.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  color: #fff;
  background-image: linear-gradient(-180deg, #353535 0%, rgba(0,0,0,0.53) 100%);
  .control-group {
    display: flex;
    align-items: center;
    .control-button {
      cursor: pointer;
      display: inline-flex;
      margin: 0 8px;
    }
  }

  &.is-embedded {
    height: 40px;
    padding: 0 10px;
  }
}
</style>
