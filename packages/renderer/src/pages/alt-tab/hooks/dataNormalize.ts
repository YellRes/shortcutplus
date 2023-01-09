import { ref, shallowRef, computed } from 'vue'
import { AppTabItem } from '../type'
import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

const dataNormalize = () => {
  const inputVal = ref<string>('')
  const allTabs = shallowRef<Array<AppTabItem>>([])
  const allTabsNameAndChildItem = shallowRef<Record<string, Array<WindowAltTabTaskItem>>>({})

  //   const allTabsNameAndChildItemFilterByInputVal =
  //   const allTabsNameAndChildItemFormat =

  //   return {
  //     inputVal,
  //     allTabs,
  //     allTabsNameAndChildItem
  //   }
}

export default dataNormalize
