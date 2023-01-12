import type { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

const formatLocalAltTabTaskArr = (localAltTabTaskArr: Array<WindowAltTabTaskItem> = []) => {
  const altTabExeNameToHwndNameObj: Record<string, Array<WindowAltTabTaskItem>> = {}

  // TODO: 需要重新优化 对程序进行分类
  return localAltTabTaskArr.reduce((pre, cur) => {
    const { processName } = cur

    if (!altTabExeNameToHwndNameObj[processName]) {
      altTabExeNameToHwndNameObj[processName] = []
      pre[processName] = []
    }

    pre[processName].push(cur)
    return pre
  }, {} as Record<string, Array<WindowAltTabTaskItem>>)
}

export default formatLocalAltTabTaskArr
