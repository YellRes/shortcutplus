import { ipcMain, globalShortcut } from 'electron'
import { app as electronApp, browserWindow } from '../index'
import { getAltTabTask, toggleThisWindows, getSelfHwnd } from './system'

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
}

/**
 * 初始化 项目中快捷键
 */
export const initShortCut = () => {
  globalShortcut.register('Alt+4', () => {
    browserWindow.focus()
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
