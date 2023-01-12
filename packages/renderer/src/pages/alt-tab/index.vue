<script setup lang="ts">
  import { ref, shallowRef, computed, watch } from 'vue'
  import { AppTabItem } from './type'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'
  import useDataNormalize from './hooks/useDataNormalize'

  const {
    inputVal,
    allTabsArr,
    filterCurrentTabs,
    allTabsNameToChildItemObj,
    tabsNameToChildItemObjFiltered
  } = useDataNormalize()

  const getAllTabs = async () => {
    let localAllAltTabProcess = await window.api.getAllAltTabTask()
    allTabsArr.value = localAllAltTabProcess
  }
  getAllTabs()

  const activeTabKey = ref<Array<string>>([])
  watch(tabsNameToChildItemObjFiltered, (val) => {
    activeTabKey.value = Object.keys(val)
  })

  const toggleThisWindows = (item: WindowAltTabTaskItem) => {
    window.api.toggleThisWindows(item.appHwnd)
  }
</script>

<template>
  <div class="alt-tab-container">
    <div class="alt-tab-container__left">
      <a-input-search
        v-model:value="inputVal"
        placeholder="搜索当前tab"
        @search="filterCurrentTabs"
      />

      <a-collapse class="collapse-container" v-model:activeKey="activeTabKey">
        <a-collapse-panel
          v-for="title in Object.keys(tabsNameToChildItemObjFiltered)"
          :key="title"
          :header="title"
        >
          <a-list
            item-layout="horizontal"
            bordered
            :data-source="tabsNameToChildItemObjFiltered[title]"
          >
            <template #renderItem="{ item }">
              <!-- <a-list-item-meta>
            <template #title>{{ item.appTitle }}</template>
            <template #avatar>
              <a-avatar :src="item.appIcon" />
            </template>
          </a-list-item-meta> -->

              <a-list-item @click="() => toggleThisWindows(item)">
                <span class="alt-tab-listItem__title">{{ item.appTitle }}</span>
              </a-list-item>
            </template>
          </a-list>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<style scoped lang="less">
  .alt-tab-container {
    display: flex;
    width: 100%;
    height: 100vh;

    .alt-tab-container__left {
      width: 100%;
      display: flex;
      flex-direction: column;

      .collapse-container {
        flex: 1;
        overflow: auto;
      }
    }
    .alt-tab-listItem__title {
      cursor: pointer;
    }
  }
</style>
