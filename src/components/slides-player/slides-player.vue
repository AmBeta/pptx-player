<template>
  <div :class="['slides-player', {
    'is-embedded': embedded,
    'show-notes': showNotes,
    'show-overview': showOverview,
  }]">
    <div class="content">
      <div class="reveal">
        <div ref="slides" class="slides" v-html="slidesHTML"></div>
      </div>
      <progress-bar
        :slides="slides"
        :slide-no="slideNo"
        :show-preview="!embedded"
        @jump="handleJump"
      ></progress-bar>
      <control-bar
        :slideNo="slideNo"
        :slidesCount="slidesCount"
        :embedded="embedded"
        @command="handleControl"
      ></control-bar>
      <transition name="fade">
        <div v-if="showOverview" class="overview">
          <slides-overview
            :slides="slides"
            :slideNo="slideNo"
            @jump="handleJump"
            @close="showOverview = !showOverview"
          ></slides-overview>
        </div>
      </transition>
    </div>
    <div class="notes">
      <div class="markdown-body" v-if="currentSlide && showNotes" v-html="currentSlide.notes"></div>
    </div>
  </div>
</template>

<script>
// import Reveal from 'reveal.js';
import AnimRunner from '../../utils/AnimRunner';
import SlidesOverview from './slides-overview';
import ControlBar from './control-bar';
import ProgressBar from './progress-bar';
import {
  CTRL_FIRST, CTRL_PREV, CTRL_NEXT, CTRL_LAST, CTRL_OVERVIEW, CTRL_NOTES, CTRL_PAGER, CTRL_FULLSCREEN
} from './config';

export default {
  components: { ControlBar, ProgressBar, SlidesOverview },

  props: {
    /** 幻灯片内容，格式为 Array<{ html: String, animation: Object, size: Object, notes: String }> */
    slides: {
      type: Array,
      default: () => [],
    },
    /** 是否为内嵌式，内嵌模式不显示预览，同时操作条更小 */
    embedded: {
      type: Boolean,
      default: false,
    },
    startPage: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      slidesHTML: '',
      slideNo: 0,
      showOverview: false,
      showNotes: false,
    };
  },

  computed: {
    slidesCount() {
      return this.slides.length;
    },

    currentSlide() {
      return this.slides[this.slideNo];
    },
  },

  watch: {
    slides: {
      immediate: true,
      handler(slides) {
        if (slides.length === 0) {
          // FIXME: should clear current slides
          return;
        }
        this.slidesHTML = slides.map(
          slide => slide.html
        ).join('');
        this.$nextTick(() => this.initSlides());
      },
    },
  },

  created() {
    // Allow Reveal to be initialized multiple times.
    // ref: https://github.com/hakimel/reveal.js/pull/2419
    delete require.cache[require.resolve('reveal.js')];
    const Reveal = require('reveal.js');
    this.Reveal = Reveal;

    this.animRunner = null;
    this.slideCtner = null;
  },

  beforeDestroy() {
    this.stopAnimation();
    this.Reveal.removeEventListener('ready', this.handleSlideChange);
    this.Reveal.removeEventListener('slidechanged', this.handleSlideChange);
  },

  methods: {
    initSlides() {
      if (this.Reveal.isReady()) return this.updateSlides();
      const { width, height } = this.slides[0].size;
      this.Reveal.initialize({
        width,
        height,
        embedded: true,
        // 禁用 history 和 hash 以避免修改 url
        history: false,
        hash: false,
        progress: false,
        controls: false,
        showNotes: false,
        // Factor of the display size that should remain empty around the content
        margin: 0,
      });

      if (this.startPage > 0) this.jumpSlide(this.startPage);
      // 自动播放幻灯片动画
      this.Reveal.addEventListener('ready', this.handleSlideChange);
      this.Reveal.addEventListener('slidechanged', this.handleSlideChange);
    },

    updateSlides() {
      const { width, height } = this.slides[0].size;
      const slideNo = this.startPage;
      this.Reveal.initialize({ width, height });
      this.Reveal.sync();
      this.slideNo = slideNo;
      this.jumpSlide(slideNo);
      this.startAnimation(slideNo);
    },

    handleSlideChange(event) {
      const { indexh } = event;
      this.slideNo = indexh;
      this.startAnimation(indexh);
    },

    startAnimation(sldIdx) {
      const slide = this.slides[sldIdx];
      this.slideCtner = this.$refs.slides.querySelector(`section:nth-child(${sldIdx + 1})`);
      this.animRunner = new AnimRunner(this.slideCtner, slide.animation);
      this.slideCtner.addEventListener('click', this.runAnimation);
      this.animRunner.start();
    },

    stopAnimation() {
      if (!this.animRunner) return;
      this.animRunner.destroy();
      this.animRunner = null;
      this.slideCtner.removeEventListener('click', this.runAnimation);
    },

    runAnimation() {
      const hasNext = this.animRunner.next();
      if (hasNext) return;
      // 没有更多动画，停止动画并跳转到下一张
      this.stopAnimation();
      this.nextSlide();
    },

    nextSlide() {
      this.stopAnimation();
      this.Reveal.next();
    },

    prevSlide() {
      this.stopAnimation();
      this.Reveal.prev();
    },

    jumpSlide(index) {
      this.stopAnimation();
      this.Reveal.slide(index);
    },

    handleControl(command) {
      switch (command) {
        case CTRL_FIRST: this.jumpSlide(0); break;
        case CTRL_LAST: this.jumpSlide(this.slides.length - 1); break;
        case CTRL_PREV: this.prevSlide(); break;
        case CTRL_NEXT: this.nextSlide(); break;
        case CTRL_NOTES: {
          this.showNotes = !this.showNotes;
          setTimeout(() => {
            // 动画结束后强制 Reveal 适应新的窗口大小
            this.Reveal.sync();
          }, 300);
          break;
        }
        case CTRL_PAGER:
        case CTRL_OVERVIEW: this.showOverview = !this.showOverview; break;
        case CTRL_FULLSCREEN: {
          this.$el.requestFullscreen();
          break;
        }
      }
    },

    handleJump(slideIndex) {
      this.jumpSlide(slideIndex);
    },
  },
}
</script>

<style lang="scss" scoped>
.slides-player {
  width: 100%;
  height: 100%;
  display: flex;
  .content {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    .reveal {
      flex: 1;
      background-color: #2f2f2f;
    }
    .overview {
      position: absolute;
      top: 0;
      height: 100%;
      width: 100%;
      z-index: 100;
    }
  }

  .notes {
    width: 0;
    background-color: #1d1d1d;
    transition: all .3s;
    overflow: hidden;
  }

  &.show-notes .notes {
    width: 25%;
  }

  &.show-overview .reveal {
    filter: blur(1em);
  }
}

// animation
.fade-enter-active, .fade-leave-active {
  transition: all .3s;
}
.fade-enter, .fade-leave-to {
  transform: scale(1.1);
  opacity: 0;
  filter: blur(10px);
}
</style>
