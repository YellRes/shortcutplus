import { Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'

export const createTray = () => {
  /**
   * Q-A: 文件中的路径最后都是打包后的路径
   *
   */
  const icon = nativeImage.createFromPath(
    path.normalize(`${__dirname}/../../asset/image/tools.png`)
  )

  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '设置',
      click: () => {}
    },
    {
      label: '关闭',
      click: () => {}
    }
  ])

  tray.setContextMenu(contextMenu)
}
