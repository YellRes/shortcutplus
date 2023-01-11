import type { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

const formatLocalAltTabTaskArr = (localAltTabTaskArr: Array<WindowAltTabTaskItem> = []) => {
  const altTabExeNameToHwndNameObj: Record<string, Array<WindowAltTabTaskItem>> = {}

  return localAltTabTaskArr.reduce((pre, cur) => {
    const { processName } = cur
    if (!pre[processName]) pre[processName] = []

    pre[processName].push(cur)
    return pre
  }, altTabExeNameToHwndNameObj)
}

export default formatLocalAltTabTaskArr
