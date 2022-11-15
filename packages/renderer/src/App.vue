<script setup lang="ts">
  const changeTitle = () => {
    window.electronAPI.setTitle('最艰难的道路')
  }
</script>

<template>
  <div>
    <a-button @click="changeTitle">change title</a-button>
  </div>
</template>

<style scoped>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
  }
</style>
