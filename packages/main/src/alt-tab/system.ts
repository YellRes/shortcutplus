import { app } from 'electron'
import { getAllInfo, toggleWindow } from './windows'
import type { WindowAltTabTaskItem } from './type'

// Q-A: 导入ffi-napi 后 打包出来的文件 electron 执行后直接退出
// A: ArrayBuffer backing stores must be allocated inside the sandbox address space
// 降低 electron 版本

// Q-A: : Dynamic Symbol Retrieval Error Win32 error 127
// A: user32 中函数名称导入错误
export const getAltTabTask = async () => {
  const altTabTaskList = await getAllInfo()
  await getProgressTaskIcon((altTabTaskList as Array<WindowAltTabTaskItem>) || [])
  return altTabTaskList
}

export const toggleThisWindows = (appHwnd: string) => {
  toggleWindow(appHwnd)
}

const getProgressTaskIcon = async (taskListArr: Array<WindowAltTabTaskItem>) => {
  const iconSet = new Set()
  for (let i = 0; i < taskListArr.length; i++) {
    const currentTaskList = taskListArr[i]
    if (iconSet.has(currentTaskList.processName)) continue

    currentTaskList.appIcon = (
      await app.getFileIcon(currentTaskList.processName, {
        size: 'large'
      })
    )?.toDataURL()
  }
}
