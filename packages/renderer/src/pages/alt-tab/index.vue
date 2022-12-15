<script setup lang="ts">
  import { ref, shallowRef } from 'vue'
  import { AppTabItem } from './type'

  const inputVal = ref<string>('')
  const filterCurrentTabs = () => {}

  const allTabs = shallowRef<Array<AppTabItem>>([])

  const getAllTabs = async () => {
    // allTabs.value = await window.api.getAllAltTabTask()
    allTabs.value = [
      {
        appTitle: 'microsoft-vsCode'
      },
      {
        appTitle: 'chrome-你不知道的JavaScript'
      },
      {
        appTitle: 'trash'
      }
    ]
  }

  getAllTabs()
</script>

<template>
  <div class="alt-tab-container">
    <div class="alt-tab-container__left">
      <a-input-search
        v-model:value="inputVal"
        placeholder="搜索当前tab"
        @search="filterCurrentTabs"
      />

      <a-list item-layout="horizontal" bordered :data-source="allTabs">
        <template #renderItem="{ item }">
          <!-- <a-list-item-meta>
            <template #title>{{ item.appTitle }}</template>
            <template #avatar>
              <a-avatar :src="item.appIcon" />
            </template>
          </a-list-item-meta> -->

          <a-list-item>{{ item.appTitle }}</a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<style scoped lang="less">
  .alt-tab-container {
    display: flex;
    width: 100%;

    .alt-tab-container__left {
      width: 100%;
    }
  }
</style>
