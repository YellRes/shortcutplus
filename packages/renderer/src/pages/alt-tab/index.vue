<script setup lang="ts">
  import { ref, shallowRef, computed } from 'vue'
  import { AppTabItem } from './type'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

  const inputVal = ref<string>('')
  const filterCurrentTabs = () => {}
  const allAltTabProcess = shallowRef<Array<AppTabItem>>([])
  const altTabObj = shallowRef<Record<string, Array<WindowAltTabTaskItem>>>({})

  const getAllTabs = async () => {
    let localAllAltTabProcess = await window.api.getAllAltTabTask()
    allAltTabProcess.value = localAllAltTabProcess
  }

  const _altTabObj = computed({
    get: () => {
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
    },
    set: (val) => {
      if (val.length === 0) return getAllTabs()
      filterAltTabByInputVal()
    }
  })
  getAllTabs()

  const filterAltTabByInputVal = () => {
    altTabObj.value = Object.keys(altTabObj.value).reduce((pre, cur) => {
      if (
        altTabObj.value[cur].length &&
        altTabObj.value[cur].find((item) => item.appTitle.includes(inputVal.value))
      ) {
        pre[cur] = altTabObj.value[cur].filter((item) => item.appTitle.includes(inputVal.value))
      }

      return pre
    }, {} as Record<string, Array<WindowAltTabTaskItem>>)
  }
  // watch(inputVal, (val) => {
  //   _altTabObj.value = val
  // })

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

    .alt-tab-container__left {
      width: 100%;
    }
    .alt-tab-listItem__title {
      cursor: pointer;
    }
  }
</style>
