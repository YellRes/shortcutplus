// packages/main/src/index.ts
import { join } from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { initIPC, initShortCut, getAppThumbnail } from './alt-tab/index'
import { createTray } from './alt-tab/tray'

// const testAddon = require('../../build/Release/testAddon.node')
const isSingleInstance = app.requestSingleInstanceLock()

if (!isSingleInstance) {
  app.quit()
  process.exit(0)
}
let browserWindow: BrowserWindow
async function createWindow() {
  browserWindow = new BrowserWindow({
    show: false,
    width: 1200,
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      webviewTag: false,
      // Electron current directory will be at `dist/main`, we need to include
      // the preload script from this relative path: `../preload/index.cjs`.
      preload: join(__dirname, '../preload/index.cjs')
    }
  })

  initIPC()
  initShortCut()
  getAppThumbnail({})

  // If you install `show: true` then it can cause issues when trying to close the window.
  // Use `show: false` and listener events `ready-to-show` to fix these issues.
  // https://github.com/electron/electron/issues/25012
  browserWindow.on('ready-to-show', () => {
    browserWindow?.show()
  })

  // Define the URL to use for the `BrowserWindow`, depending on the DEV env.
  const pageUrl = import.meta.env.DEV
    ? 'http://localhost:3030'
    : new URL('../dist/renderer/index.html', `file://${__dirname}`).toString()

  await browserWindow.loadURL(pageUrl)

  browserWindow.setParentWindow(null)
  // testAddon.getThumbnail()
  return browserWindow
}

app.on('second-instance', () => {
  createWindow().catch((err) =>
    console.error('Error while trying to prevent second-instance Electron event:', err)
  )
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let instanceWindow
app.on('activate', () => {
  instanceWindow = createWindow()
  instanceWindow.catch((err) =>
    console.error('Error while trying to handle activate Electron event:', err)
  )
})

app
  .whenReady()
  .then(createWindow)
  .then(createTray)
  .catch((e) => console.error('Failed to create window:', e))

export { browserWindow, app, instanceWindow }
