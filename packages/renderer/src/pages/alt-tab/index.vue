<script setup lang="ts">
  import { ref, shallowReactive } from 'vue'
  import { AppTabItem } from './type'

  const inputVal = ref<string>('')
  const filterCurrentTabs = () => {}

  const allTabs: Array<AppTabItem> = shallowReactive([])

  const getAllTabs = () => {}
</script>

<template>
  <div id="alt-tab-container">
    <div class="alt-tab-container__left">
      <a-input-search
        v-model:value="inputVal"
        placeholder="input search text"
        style="width: 200px"
        @search="filterCurrentTabs"
      />

      <a-list item-layout="horizontal" :data-source="allTabs">
        <template #renderItem="{ item }">
          <a-list-item-meta>
            <template #title>{{ item.appTitle }}</template>
            <template #avatar>
              <a-avatar :src="item.appIcon" />
            </template>
          </a-list-item-meta>
        </template>
      </a-list>
    </div>

    <div></div>
  </div>
</template>

<style scoped lang="less">
  .alt-tab-container {
    display: flex;
    height: 720px;

    .alt-tab-container__left {
      width: 30%;
    }
  }
</style>
