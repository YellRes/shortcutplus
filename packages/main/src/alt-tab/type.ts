export interface WindowAltTabTaskItem {
  appHwnd: number
  appIcon?: string | undefined
  appTitle: string
  processName: string
}

export interface WindowAltTabTask {
  processName: string
}
