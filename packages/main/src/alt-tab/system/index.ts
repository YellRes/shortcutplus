import { app, BrowserWindow, nativeImage } from 'electron'
import { getAllInfo, toggleWindow, getWindowCurrentProcessThumbnail } from './windows'
import type { WindowAltTabTaskItem } from '../type'
import { browserWindow } from '../../index'
import fs from 'fs'

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

// 获取对应进程的图标
// A: 直接使用 electron 的api getFileIcon()
// Q-A: Electron 是如何获取windows图标转成base64显示的
// 从路径中读取文件 buffer
// 把 buffer 转换成base64

// Q-A: 如何把hicon 找到对应的buffer信息
const getProgressTaskIcon = async (taskListArr: Array<WindowAltTabTaskItem>) => {
  const iconSet = new Set()
  // const appItem = taskListArr[0]

  // Q-A: buffer 类型和pointer 类型的区别
  // getWindowCurrentProcessThumbnail(getSelfHwnd(), appItem.appHwnd)
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

// 获取进程的缩略图
export const getSelfHwnd = () => browserWindow.getNativeWindowHandle()

// 获取进程的缩略图
export const getCurrentProcessThumbnail = (hwnd: number) => {
  try {
    const { bmp } = getWindowCurrentProcessThumbnail(hwnd)

    // 将缩略图保存到文件
    const filePath = 'thumbnail.bmp'
    fs.writeFileSync(filePath, bmp)

    // 在 Electron 窗口中显示缩略图
    const thumbnailImage = nativeImage.createFromPath(filePath)
    console.log(thumbnailImage.toDataURL(), 'thumbnailImage.toDataURL()')
    return thumbnailImage.toDataURL()
  } catch (e) {
    console.warn(e)
  }
}
