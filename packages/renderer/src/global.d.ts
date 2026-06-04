import type { WindowAltTabTaskItem } from 'main/src/alt-tab/type'

declare global {
  interface Window {
    api: {
      openUrl: (url: string) => void
      getAllAltTabTask: () => Promise<WindowAltTabTaskItem[]>
      toggleThisWindows: (appHwnd: number) => void
      getCurrentHwnd: () => Promise<unknown>
      getAppThumbnail: (hwnd: number) => Promise<string>
      hideMainApp: () => void
      // 注册窗口唤起刷新回调，返回取消监听的函数
      onRefresh: (cb: () => void) => () => void
    }
  }
}

export {}
