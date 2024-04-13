<template>
  <div class="demo-page">
    <div class="slides-player">
      <slides-player></slides-player>
    </div>
  </div>
</template>

<script>
import SlidesPlayer from './components/slides-player';

export default {
  name: 'Demo',

  components: { SlidesPlayer },
}
</script>

<style lang="scss" scoped>
.slides-player {
  width: 1080px;
  height: 720px;
  margin: 25px auto;
}
</style>

