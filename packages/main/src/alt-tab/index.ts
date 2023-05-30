import { ipcMain, globalShortcut, desktopCapturer } from 'electron'
import { app as electronApp, browserWindow } from '../index'
import { getAltTabTask, toggleThisWindows, getSelfHwnd } from './system'
import { WindowAltTabTaskItem } from './type'

/**
 * app 和 windows 是什么关系
 * 一个app 会有多个 window
 * */

async function handleAltTabTaskGet() {
  const altTabTaskList = await getAltTabTask()
  return altTabTaskList
}

async function handleCurrentHwnd() {
  const currentHwnd = await getSelfHwnd()
  return currentHwnd
}
/**
 * 初始化 项目中进程通信
 *
 * get-altTab-task 获取当前系统所有运行在 alt+tab 中的任务
 *
 * toggle-this-windows 切换到某个任务
 */
export const initIPC = () => {
  ipcMain.handle('get-altTab-task', handleAltTabTaskGet)
  ipcMain.handle('get-current-hwnd', handleCurrentHwnd)

  ipcMain.on('toggle-this-windows', (event, apphwnd) => {
    toggleThisWindows(apphwnd)
  })

  ipcMain.on('hide-main-app', () => {
    // electronApp.hide()
    browserWindow.hide()
  })
}

/**
 * 初始化 项目中快捷键
 */
export const initShortCut = () => {
  globalShortcut.register('Alt+4', () => {
    browserWindow.show()
    // browserWindow.focus()
  })
}

export const unRegisterShortCut = () => {
  globalShortcut.unregisterAll()
}

export const initAppEvent = () => {
  browserWindow.on('blur', () => {
    browserWindow.setPosition(0, -10000)
    browserWindow.hide()
  })
}

/**
 * 获取app的系统截图
 * TODO:
 * 先使用 desktopCapturer.getSources 来实现
 * 缺点：只能找到激活的应用的截图 无法找到未激活应用的截图
 * */
export const getAppThumbnail = (appInfo: WindowAltTabTaskItem) => {
  // 只能获取到 显示到桌面上的窗口
  desktopCapturer
    .getSources({
      types: ['window'],
      thumbnailSize: {
        width: 800,
        height: 600
      }
    })
    .then(async (sources) => {
      ipcMain.handle('console-log', () => new Promise((res) => res(sources)))

      for (const source of sources) {
        if (source.name === appInfo.appTitle) {
          ipcMain.handle('get-app-thumbnail', () => new Promise((res) => res(source.id)))
          break
        }
      }
    })
}
