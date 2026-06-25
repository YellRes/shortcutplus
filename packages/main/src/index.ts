// packages/main/src/index.ts
import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { initIPC, initShortCut, initAppEvent } from './alt-tab/index'
import { createTray } from './alt-tab/tray'
import { assetPath } from './asset'

const isSingleInstance = app.requestSingleInstanceLock()
const appIconPath = assetPath('image/app-icon.png')

if (!isSingleInstance) {
  app.quit()
  process.exit(0)
}

let browserWindow: BrowserWindow
let settingsWindow: BrowserWindow | null = null

// 渲染层基础 URL（dev 用 vite 服务，prod 用打包后的 index.html）
const rendererBaseUrl = () =>
  import.meta.env.DEV
    ? 'http://localhost:3030'
    : new URL('../dist/renderer/index.html', `file://${__dirname}`).toString()

/**
 * 设置窗口：一个普通的有边框窗口（非透明/非置顶/不随失焦隐藏），
 * 通过 hash 路由 #/settings 复用同一套渲染层。单实例，已开则聚焦。
 */
export function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }
  settingsWindow = new BrowserWindow({
    width: 460,
    height: 380,
    resizable: false,
    maximizable: false,
    title: 'AltSwitch 设置',
    icon: appIconPath,
    backgroundColor: '#18181b',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.cjs')
    }
  })
  settingsWindow.setMenuBarVisibility(false)
  settingsWindow.loadURL(rendererBaseUrl() + '#/settings')
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

async function createWindow() {
  browserWindow = new BrowserWindow({
    show: false,
    // 切换器是悬浮覆盖层：无边框 + 透明 + 置顶，居中显示，唯一可见的是渲染层画的圆角面板
    width: 760,
    height: 520,
    center: true,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: appIconPath,
    backgroundColor: '#00000000',
    webPreferences: {
      webviewTag: false,
      // 显式声明安全相关项（与 Electron 19 默认一致，防止后续升级回退）
      contextIsolation: true,
      nodeIntegration: false,
      // Electron current directory will be at `dist/main`, we need to include
      // the preload script from this relative path: `../preload/index.cjs`.
      preload: join(__dirname, '../preload/index.cjs')
    }
  })

  initIPC()
  initShortCut()
  initAppEvent()

  // If you install `show: true` then it can cause issues when trying to close the window.
  // Use `show: false` and listener events `ready-to-show` to fix these issues.
  // https://github.com/electron/electron/issues/25012
  browserWindow.on('ready-to-show', () => {
    browserWindow?.show()
  })

  await browserWindow.loadURL(rendererBaseUrl())

  return browserWindow
}

app.on('second-instance', () => {
  // 已有单实例，直接显示现有窗口，而不是再创建一个
  if (browserWindow) {
    if (browserWindow.isMinimized()) browserWindow.restore()
    browserWindow.show()
    browserWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (browserWindow) {
    browserWindow.show()
  } else {
    createWindow().catch((err) =>
      console.error('Error while trying to handle activate Electron event:', err)
    )
  }
})

app
  .whenReady()
  .then(createWindow)
  .then(createTray)
  .catch((e) => console.error('Failed to create window:', e))

export { browserWindow, app }
