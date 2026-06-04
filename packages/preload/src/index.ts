// packages/preload/src/index.ts
import { contextBridge, shell, ipcRenderer } from 'electron'

// Add a `window.api` object inside the renderer process.
contextBridge.exposeInMainWorld('api', {
  // Open an URL into the default web-browser.
  openUrl: (url: string) => shell.openExternal(url),
  getAllAltTabTask: () => ipcRenderer.invoke('get-altTab-task'),
  toggleThisWindows: (appHwnd: number) => ipcRenderer.send('toggle-this-windows', appHwnd),
  getCurrentHwnd: () => ipcRenderer.invoke('get-current-hwnd'),
  // 统一为 invoke/handle，与主进程 handler 协议一致（之前用 send 拿不到返回值）
  getAppThumbnail: (hwnd: number): Promise<string> => ipcRenderer.invoke('get-app-thumbnail', hwnd),
  hideMainApp: () => ipcRenderer.send('hide-main-app'),
  // 窗口被唤起(show)时主进程会推送 refresh-tasks，渲染层据此刷新列表（替代 30s 轮询）
  onRefresh: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('refresh-tasks', listener)
    return () => ipcRenderer.removeListener('refresh-tasks', listener)
  }
})
