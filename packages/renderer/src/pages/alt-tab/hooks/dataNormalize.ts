import { ref, shallowRef, computed } from 'vue'
import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'
import formatLocalAltTabTaskArr from '../util/formatLocalAltTabTaskArr'

const dataNormalize = () => {
  const inputVal = ref<string>('')
  const allTabsArr = shallowRef<Array<WindowAltTabTaskItem>>([])
  // 将 allTabsArr 数组的任务 通过单个item中的processName来分类
  const allTabsNameToChildItemObj = computed<Record<string, Array<WindowAltTabTaskItem>>>(() =>
    formatLocalAltTabTaskArr(allTabsArr.value)
  )

  // 经过筛选过的 altTab 的任务
  const tabsNameToChildItemObjFiltered = computed<Record<string, Array<WindowAltTabTaskItem>>>(
    () => {
      const selectedTabArr = allTabsArr.value.filter((item) =>
        item.appTitle.includes(inputVal.value)
      )

      return formatLocalAltTabTaskArr(selectedTabArr)
    }
  )

  return {
    inputVal,
    allTabsArr,
    allTabsNameToChildItemObj,
    tabsNameToChildItemObjFiltered
  }
}

export default dataNormalize
