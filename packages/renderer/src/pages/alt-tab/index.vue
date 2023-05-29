<script setup lang="ts">
  import { ref, shallowRef, computed, watch } from 'vue'
  import { useIntervalFn } from '@vueuse/core'
  import { AppTabItem } from './type'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

  import useDataNormalize from './hooks/useDataNormalize'
  import { Item } from 'ant-design-vue/lib/menu'

  const currentHwnd = ref<Number>()
  const getCurrentHwnd = async () => {
    currentHwnd.value = await window.api.getCurrentHwnd()
  }

  getCurrentHwnd()

  const consoleLogVal = ref<string>('')
  const getConsoleLog = async () => {
    consoleLogVal.value = await window.api.consoleLog()
  }

  const {
    inputVal,
    allTabsArr,
    filterCurrentTabs,
    allTabsNameToChildItemObj,
    tabsNameToChildItemObjFiltered
  } = useDataNormalize()

  /**
   * 获取当前运行的程序
   * */
  const getAllTabs = async () => {
    let localAllAltTabProcess = await window.api.getAllAltTabTask()
    allTabsArr.value = localAllAltTabProcess
  }
  getAllTabs()

  // 每隔15s 获取下目前打开的程序
  useIntervalFn(() => {
    getAllTabs()
    getConsoleLog()
  }, 15000)

  const activeTabKey = ref<Array<string>>([])
  watch(tabsNameToChildItemObjFiltered, (val) => {
    activeTabKey.value = Object.keys(val)
  })

  /**
   * 切换选中的程序
   */
  const toggleThisWindows = (item: WindowAltTabTaskItem) => {
    window.api.toggleThisWindows(item.appHwnd)
  }

  /**
   * 应用缩略图
   * */
  const appThumbnail = ref<string>('')
  const getAppThumbnail = async (appInfo: WindowAltTabTaskItem) => {
    try {
      appThumbnail.value = await window.api.getAppThumbnail(appInfo)
    } catch (e) {
      appThumbnail.value = ''
    }
  }
</script>

<template>
  <pre>{{ consoleLogVal }}</pre>
  <div>
    <a-input-search
      v-model:value="inputVal"
      placeholder="搜索当前tab"
      @search="filterCurrentTabs"
      size="large"
    />
    <div class="alt-tab-container">
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
                  <div>
                    <a-avatar :src="item.appIcon" />
                    <span
                      class="alt-tab-listItem__title"
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

      <div class="alt-tab-container__right">
        <img :src="appThumbnail" alt="应用缩略图" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
  .alt-tab-container {
    display: flex;
    width: 100%;
    height: 100vh;
    padding-top: 20px;

    .alt-tab-container__left {
      width: 50%;
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
