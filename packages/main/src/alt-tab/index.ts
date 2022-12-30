import { ipcMain } from 'electron'
import { getAltTabTask, toggleThisWindows } from './system'

async function handleAltTabTaskGet() {
  const altTabTaskList = getAltTabTask()

  return altTabTaskList
}

export const initIPC = () => {
  ipcMain.handle('get-altTab-task', handleAltTabTaskGet)

  ipcMain.on('toggle-this-windows', (event, apphwnd) => {
    toggleThisWindows(apphwnd)
  })
}
