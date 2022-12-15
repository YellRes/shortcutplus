<script setup lang="ts">
  const changeTitle = () => {
    window.electronAPI.setTitle('最艰难的道路')
  }
</script>

<template>
  <router-view></router-view>
</template>

<style scoped></style>
