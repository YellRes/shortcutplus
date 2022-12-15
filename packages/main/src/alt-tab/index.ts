import { ipcMain } from 'electron'
import { getAltTabTask } from './system'

async function handleAltTabTaskGet() {
  const altTabTaskList = await getAltTabTask()
  return altTabTaskList
}

export const initIPC = () => {
  ipcMain.handle('get-altTab-task', handleAltTabTaskGet)
}
