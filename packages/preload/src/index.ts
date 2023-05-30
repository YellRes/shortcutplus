// packages/preload/src/index.ts
import { contextBridge, shell, ipcRenderer } from 'electron'
import { getAppScreenshot } from '../../renderer/src/pages/alt-tab/util/getAppScreenshot'
import { createVideoStream } from '../../renderer/src/pages/alt-tab/util/createVideoStream'

// Add a `window.api` object inside the renderer process with the `openUrl`
// function.
contextBridge.exposeInMainWorld('api', {
  // Open an URL into the default web-browser.
  openUrl: (url: string) => shell.openExternal(url),
  getAllAltTabTask: () => ipcRenderer.invoke('get-altTab-task'),
  toggleThisWindows: (appHwnd: number) => ipcRenderer.send('toggle-this-windows', appHwnd),
  getCurrentHwnd: () => ipcRenderer.invoke('get-current-hwnd'),
  getAppThumbnail: (appInfo: any) => ipcRenderer.send('get-app-thumbnail', appInfo),
  consoleLog: () => ipcRenderer.invoke('console-log'),
  hideMainApp: () => ipcRenderer.send('hide-main-app')
})

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
})

// ipcRenderer.on('SET_SOURCE', async (event, sourceId) => {
//   const imgDom = document.getElementById('#my-preview') as HTMLImageElement
//   try {
//     const stream = await createVideoStream(sourceId)
//     imgDom.src = await getAppScreenshot(stream)
//   } catch (e) {
//     imgDom.src = ''
//     console.log(e)
//   }
// })
