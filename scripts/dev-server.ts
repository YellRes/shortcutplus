// scripts/dev-server.ts
import type { InlineConfig, ViteDevServer } from 'vite'
import type { ChildProcessWithoutNullStreams } from 'child_process'
import electronPath from 'electron'
import { build, createLogger, createServer } from 'vite'
import { spawn } from 'child_process'

// Shared config across multiple build watchers.
const sharedConfig: InlineConfig = {
  mode: 'development',
  build: { watch: {} }
}

/**
 * Create a Vite build watcher that automatically recompiles when a file is
 * edited.
 */
const getWatcher = (name: string, configFilePath: string, writeBundle: any) =>
  build({
    ...sharedConfig,
    configFile: configFilePath,
    plugins: [{ name, writeBundle }]
  })

/**
 * Setup a watcher for the preload package.
 */
const setupPreloadWatcher = async (viteServer: ViteDevServer) =>
  getWatcher('reload-app-on-preload-package-change', 'packages/preload/vite.config.ts', () => {
    // Send a "full-reload" page event using Vite WebSocket server.
    viteServer.ws.send({ type: 'full-reload' })
  })

/**
 * Setup the `main` watcher.
 */
const setupMainWatcher = async () => {
  const logger = createLogger('info', { prefix: '[main]' })
  let spawnProcess: ChildProcessWithoutNullStreams | null = null

  return getWatcher('reload-app-on-main-package-change', 'packages/main/vite.config.ts', () => {
    if (spawnProcess !== null) {
      spawnProcess.off('exit', () => process.exit(0))
      spawnProcess.kill('SIGINT')
      spawnProcess = null
    }

    // Restart Electron process when main package is edited and recompiled.
    spawnProcess = spawn(String(electronPath), ['.'])

    spawnProcess.stderr.on('data', (data: any) => {
      console.log(data, 'spawnProcess.stderr')
    })

    spawnProcess.on('close', (data: any) => {
      console.log(data, 'electron close')
    })
  })
}

;(async () => {
  try {
    const rendererServer = await createServer({
      ...sharedConfig,
      configFile: 'packages/renderer/vite.config.ts'
    })

    await rendererServer.listen()
    rendererServer.printUrls()

    await setupPreloadWatcher(rendererServer)
    await setupMainWatcher()
  } catch (err) {
    console.error(err)
  }
})().catch((err) => console.error(err))

/**
 * Q: 项目是如何启动的？
 * A:
 * 1. 启动 render 中的网页
 *  1.1. 调用了 vite 的 build 和 createServer
 *  1.2
 * 2. 启动 main 中 electron 的服务
 *
 */
