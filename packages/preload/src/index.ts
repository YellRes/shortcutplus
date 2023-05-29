// packages/preload/src/index.ts
import { contextBridge, shell, ipcRenderer } from 'electron'

// Add a `window.api` object inside the renderer process with the `openUrl`
// function.
contextBridge.exposeInMainWorld('api', {
  // Open an URL into the default web-browser.
  openUrl: (url: string) => shell.openExternal(url),
  getAllAltTabTask: () => ipcRenderer.invoke('get-altTab-task'),
  toggleThisWindows: (appHwnd: number) => ipcRenderer.send('toggle-this-windows', appHwnd),
  getCurrentHwnd: () => ipcRenderer.invoke('get-current-hwnd'),
  getAppThumbnail: () => ipcRenderer.invoke('get-app-thumbnail'),
  consoleLog: () => ipcRenderer.invoke('console-log'),
  hideMainApp: () => ipcRenderer.invoke('hide-main-app')
})

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
})
