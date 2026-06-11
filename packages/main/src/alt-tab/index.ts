import { ipcMain, globalShortcut, desktopCapturer, type DesktopCapturerSource } from 'electron'
import { browserWindow } from '../index'
import { getAltTabTask, toggleThisWindows, getSelfHwnd, closeThisWindow } from './system'

/**
 * app 和 windows 是什么关系
 * 一个app 会有多个 window
 * */

async function handleAltTabTaskGet() {
  return await getAltTabTask()
}

async function handleCurrentHwnd() {
  return await getSelfHwnd()
}

/**
 * 缩略图：用 Electron 自带的 desktopCapturer（Windows 上 source.id 形如 `window:<HWND>:0`，按 HWND 匹配）。
 *
 * 混合缓存策略，解决最小化/无实时帧窗口截图为空的问题：
 * - 可见窗口：实时截图，并把这一帧缓存为该 HWND 的「最后已知帧」(thumbnailCache，跨多次唤起持久)；
 * - 最小化/被遮挡无帧：getSources 给空图(isEmpty)，回退到缓存的最后已知帧；
 * - 从未截到过：返回 ''，由渲染层回退显示应用图标。
 *
 * 另用 sourcesByHwnd 短时缓存整次 getSources 结果，避免键盘快速上下选择时反复全量截图。
 */
const thumbnailCache = new Map<number, string>()
let sourcesByHwnd = new Map<number, DesktopCapturerSource>()
let sourcesCacheAt = 0
const SOURCES_TTL = 1000

const refreshSources = async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 320, height: 200 }
  })
  const map = new Map<number, DesktopCapturerSource>()
  for (const s of sources) {
    const hwnd = Number(s.id.split(':')[1])
    if (hwnd) map.set(hwnd, s)
  }
  sourcesByHwnd = map
  sourcesCacheAt = Date.now()
}

async function handleAppThumbnail(_event: unknown, hwnd: number) {
  if (Date.now() - sourcesCacheAt > SOURCES_TTL) {
    await refreshSources()
  }
  const src = sourcesByHwnd.get(hwnd)
  if (src && !src.thumbnail.isEmpty()) {
    const url = src.thumbnail.toDataURL()
    thumbnailCache.set(hwnd, url)
    return url
  }
  // 最小化/无实时帧：回退到最后已知帧；都没有则返回 ''（渲染层显示应用图标）
  return thumbnailCache.get(hwnd) ?? ''
}

/**
 * 初始化 项目中进程通信（handler 只在此注册一次）
 *
 * get-altTab-task     获取当前系统所有运行在 alt+tab 中的任务
 * get-current-hwnd    获取本应用窗口句柄
 * get-app-thumbnail   获取指定窗口缩略图
 * toggle-this-windows 切换到某个任务
 * hide-main-app       隐藏本应用
 */
export const initIPC = () => {
  ipcMain.handle('get-altTab-task', handleAltTabTaskGet)
  ipcMain.handle('get-current-hwnd', handleCurrentHwnd)
  ipcMain.handle('get-app-thumbnail', handleAppThumbnail)

  ipcMain.on('toggle-this-windows', (_event, apphwnd) => {
    toggleThisWindows(apphwnd)
  })

  ipcMain.on('close-this-window', (_event, hwnd) => {
    closeThisWindow(hwnd)
  })

  ipcMain.on('hide-main-app', () => {
    browserWindow.hide()
  })
}

/**
 * 唤起主窗口：居中 + 显示 + 聚焦。快捷键与托盘共用，避免逻辑重复。
 *
 * 透明窗口在 Windows 上 show() 时会有一帧露出默认底色的“闪烁”。
 * 做法：show() 前把不透明度设为 0，让那一帧发生在不可见状态，下一帧再恢复，
 * 从而遮掉闪烁。仅在窗口此前不可见时才做这套遮帧，避免已可见时（如托盘“显示”）反而闪一下。
 */
export const showMainWindow = () => {
  const wasVisible = browserWindow.isVisible()
  if (!wasVisible) browserWindow.setOpacity(0)
  browserWindow.center()
  browserWindow.show()
  browserWindow.focus()
  if (!wasVisible) setTimeout(() => browserWindow.setOpacity(1), 32)
}

/**
 * 初始化 项目中快捷键：Alt+4 切换显示/隐藏
 */
export const initShortCut = () => {
  globalShortcut.register('Alt+4', () => {
    if (browserWindow.isVisible()) {
      browserWindow.hide()
    } else {
      showMainWindow()
    }
  })
}

export const unRegisterShortCut = () => {
  globalShortcut.unregisterAll()
}

/**
 * 窗口事件：失焦自动隐藏（切换器的核心交互）；显示时通知渲染层刷新列表
 */
export const initAppEvent = () => {
  browserWindow.on('blur', () => {
    browserWindow.hide()
  })
  browserWindow.on('show', () => {
    browserWindow.webContents.send('refresh-tasks')
  })
}
