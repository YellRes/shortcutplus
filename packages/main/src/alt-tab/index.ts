import { ipcMain } from 'electron'

export const initIPC = () => {
  ipcMain.on('get-all-running-processes', (event) => {})
}
