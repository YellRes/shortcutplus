import { app } from 'electron'
import { join } from 'node:path'
import fs from 'node:fs'

export interface AppSettings {
  hotkey: string // Electron accelerator，如 'Alt+4'
  autoLaunch: boolean // 开机自启
}

const DEFAULTS: AppSettings = { hotkey: 'Alt+4', autoLaunch: false }

// 存到用户数据目录，主进程读写（渲染层经 IPC 间接访问）
const settingsFile = () => join(app.getPath('userData'), 'settings.json')

export const getSettings = (): AppSettings => {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf-8')) }
  } catch {
    return { ...DEFAULTS }
  }
}

export const saveSettings = (patch: Partial<AppSettings>): AppSettings => {
  const next = { ...getSettings(), ...patch }
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2))
  return next
}
