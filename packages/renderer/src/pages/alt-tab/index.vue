<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useIntervalFn } from '@vueuse/core'
  // import { AppTabItem } from './type'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

  import useDataNormalize from './hooks/useDataNormalize'
  import { SearchOutlined } from '@ant-design/icons-vue'
  // import { getAppScreenshot } from './util/getAppScreenshot'
  // import { createVideoStream } from './util/createVideoStream'

  const currentHwnd = ref<Number>()
  const getCurrentHwnd = async () => {
    currentHwnd.value = await window.api.getCurrentHwnd()
  }

  getCurrentHwnd()

  const consoleLogVal = ref<string>('')
  // const getConsoleLog = async () => {
  //   consoleLogVal.value = await window.api.consoleLog()
  // }

  const {
    inputVal,
    allTabsArr,
    filterCurrentTabs,
    allTabsNameToChildItemObj,
    tabsNameToChildItemObjFiltered
  } = useDataNormalize()

  const loading = ref(false)
  /**
   * 获取当前运行的程序
   * */
  const getAllTabs = async () => {
    loading.value = true
    try {
      let localAllAltTabProcess = await window.api.getAllAltTabTask()
      allTabsArr.value = localAllAltTabProcess
    } catch (e) {
      console.log(e)
    }
    loading.value = false
  }
  getAllTabs()

  // 每隔30s 获取下目前打开的程序
  useIntervalFn(() => {
    getAllTabs()
    // getConsoleLog()
  }, 30000)

  const activeTabKey = ref<Array<string>>([])
  watch(tabsNameToChildItemObjFiltered, (val) => {
    activeTabKey.value = Object.keys(val)
  })

  /**
   * 切换选中的程序
   */
  const toggleThisWindows = (item: WindowAltTabTaskItem) => {
    window.api.toggleThisWindows(item.appHwnd)
    window.api.hideMainApp()
  }

  /**
   * 应用缩略图
   * */
  // const appThumbnail = ref<string>('')
  const getAppThumbnail = async (appInfo: WindowAltTabTaskItem) => {}
</script>

<template>
  <div class="relative">
    <div class="sticky top-0 bg-white z-10">
      <a-input
        v-model:value="inputVal"
        placeholder="搜索当前运行中的应用"
        @search="filterCurrentTabs"
        size="large"
      >
        <template #prefix>
          <search-outlined />
        </template>
      </a-input>
    </div>
    <a-spin v-if="loading" />
    <div class="alt-tab-container" v-else>
      <div class="alt-tab-container__left">
        <a-collapse class="collapse-container" v-model:activeKey="activeTabKey" :bordered="false">
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
                <a-list-item>
                  <div class="max-w-[100%] text-ellipsis overflow-hidden whitespace-nowrap">
                    <a-avatar :src="item.appIcon" />
                    <span
                      class="alt-tab-listItem__title overflow-hidden break-all mt-6 text-blue-600"
                      @mouseover="getAppThumbnail(item)"
                      @click="toggleThisWindows(item)"
                      >{{ item.appTitle }}
                    </span>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-collapse-panel>
        </a-collapse>
      </div>

      <!-- <div class="alt-tab-container__right">
        <img id="my-preview" :src="appThumbnail" alt="应用缩略图" />
      </div> -->
    </div>
  </div>
</template>

<style scoped lang="less">
  .alt-tab-container {
    display: flex;
    width: 100%;

    .alt-tab-container__left {
      width: 100%;
      display: flex;
      flex-direction: column;

      .collapse-container {
        flex: 1;
        overflow: auto;
        // margin-top: 20px;
      }
    }
    .alt-tab-listItem__title {
      cursor: pointer;
      margin-left: 8px;
    }
    .alt-tab-container__right {
      flex: 1;
    }
  }
</style>

<style lang="less">
  .alt-tab-container {
    .ant-list-item {
      padding: 8px;
    }
  }
</style>
