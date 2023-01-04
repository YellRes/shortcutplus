<script setup lang="ts">
  import { ref, shallowRef, computed } from 'vue'
  import { AppTabItem } from './type'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

  const inputVal = ref<string>('')
  const filterCurrentTabs = () => {}
  const allTabs = shallowRef<Array<AppTabItem>>([])
  const altTabObj = shallowRef<Record<string, Array<WindowAltTabTaskItem>>>({})

  const getAllTabs = async () => {
    let { altTabObj: altTabData, allAltTabProcess } = await window.api.getAllAltTabTask()
    allTabs.value = allAltTabProcess
    altTabObj.value = altTabData
  }

  const _altTabObj = computed(() => {
    return Object.keys(altTabObj.value).reduce((pre, cur) => {
      if (altTabObj.value[cur].length) {
        const altTabItem = altTabObj.value[cur][0]
        // Q-A: 字符串中有 - 就获取 - 后面的数据 没有就获取整个字段 提供正则
        let [altTabItemTitle] = altTabItem.appTitle.match(
          /((?<=-(?=[^-]+$)).*$)|(^((?!-).)*$)/g
        ) as Array<string>

        pre[altTabItemTitle] = altTabObj.value[cur]
      }

      return pre
    }, {} as Record<string, Array<WindowAltTabTaskItem>>)
  })
  getAllTabs()

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

      <a-collapse>
        <a-collapse-panel v-for="title in Object.keys(_altTabObj)" :key="title" :header="title">
          <a-list item-layout="horizontal" bordered :data-source="_altTabObj[title]">
            <template #renderItem="{ item }">
              <!-- <a-list-item-meta>
            <template #title>{{ item.appTitle }}</template>
            <template #avatar>
              <a-avatar :src="item.appIcon" />
            </template>
          </a-list-item-meta> -->

              <a-list-item @click="() => toggleThisWindows(item)">{{ item.appTitle }}</a-list-item>
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

    .alt-tab-container__left {
      width: 100%;
    }
  }
</style>
