import { app, Tray, Menu, nativeImage } from 'electron'
import { assetPath } from '../asset'
import { showMainWindow } from './index'
import { openSettingsWindow } from '../index'

export const createTray = () => {
  // 用 assetPath 解析，开发/打包都能正确找到图标（见 asset.ts）
  const icon = nativeImage.createFromPath(assetPath('image/app-icon.png'))

  const tray = new Tray(icon)
  tray.setToolTip('AltSwitch')

  // 双击托盘图标唤起窗口（失焦会隐藏，这是除 Alt+4 外的另一个唤起入口）
  tray.on('double-click', () => showMainWindow())

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      click: () => showMainWindow()
    },
    {
      label: '设置',
      click: () => openSettingsWindow()
    },
    { type: 'separator' },
    {
      label: '关闭',
      // 退出整个程序。窗口只是隐藏（托盘常驻），所以必须用 app.quit() 真正退出
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(contextMenu)
}
