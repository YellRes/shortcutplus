import { app } from 'electron'
import { getAllInfo, toggleWindow } from './windows'
import type { WindowAltTabTaskItem } from '../type'
import { browserWindow } from '../../index'

export const getAltTabTask = async () => {
  const altTabTaskList = ((await getAllInfo()) as Array<WindowAltTabTaskItem>) || []
  await getProgressTaskIcon(altTabTaskList)
  return altTabTaskList
}

export const toggleThisWindows = (appHwnd: number) => {
  toggleWindow(appHwnd)
}

// 进程图标缓存：同一 exe 路径的图标基本不变，跨轮次复用，避免重复 getFileIcon
const iconCache = new Map<string, string>()

// 获取每个任务对应进程的图标（用 electron 的 app.getFileIcon，从 exe 路径取）
const getProgressTaskIcon = async (taskListArr: Array<WindowAltTabTaskItem>) => {
  // 按 exe 路径去重，每个进程只取一次图标（之前 iconSet 从未 add，去重是死代码）
  const uniqueNames = [...new Set(taskListArr.map((t) => t.processName).filter(Boolean))]

  await Promise.all(
    uniqueNames.map(async (name) => {
      if (iconCache.has(name)) return
      try {
        const icon = await app.getFileIcon(name, { size: 'large' })
        iconCache.set(name, icon.toDataURL())
      } catch (e) {
        // 单个进程取图标失败不能中断整张列表（否则 reject 会让整批列表更新失败）
        console.warn('getFileIcon failed:', name, e)
      }
    })
  )

  for (const task of taskListArr) {
    if (task.processName && iconCache.has(task.processName)) {
      task.appIcon = iconCache.get(task.processName)
    }
  }
}

// 获取本应用窗口的原生句柄
export const getSelfHwnd = () => browserWindow.getNativeWindowHandle()
