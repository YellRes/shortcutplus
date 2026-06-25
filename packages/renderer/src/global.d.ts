import type { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

declare global {
  interface Window {
    api: {
      openUrl: (url: string) => void
      getAllAltTabTask: () => Promise<WindowAltTabTaskItem[]>
      toggleThisWindows: (appHwnd: number) => void
      closeWindow: (hwnd: number) => void
      getCurrentHwnd: () => Promise<unknown>
      getAppThumbnail: (hwnd: number) => Promise<string>
      hideMainApp: () => void
      // 注册窗口唤起刷新回调，返回取消监听的函数
      onRefresh: (cb: () => void) => () => void
      // 设置读写
      getSettings: () => Promise<{ hotkey: string; autoLaunch: boolean }>
      saveSettings: (patch: {
        hotkey?: string
        autoLaunch?: boolean
      }) => Promise<{ settings: { hotkey: string; autoLaunch: boolean }; hotkeyOk: boolean }>
    }
  }
}

export {}
