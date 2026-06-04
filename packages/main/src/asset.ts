import { app } from 'electron'
import { join } from 'node:path'

/**
 * 解析随包资源路径。
 * - 开发：相对项目根（process.cwd()）
 * - 打包：相对 process.resourcesPath（electron-builder 的 extraResources 把 asset/ 复制到这里）
 *
 * 之前直接用 process.cwd() 取图标，打包安装后 CWD 不确定会导致托盘/应用图标丢失。
 */
export const assetPath = (rel: string) =>
  join(app.isPackaged ? process.resourcesPath : process.cwd(), 'asset', rel)
