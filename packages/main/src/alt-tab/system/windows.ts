import koffi from 'koffi'
import { libDwmApi, libUser32Api, libProcessThreadsApi, EnumWindowsProc } from '../../lib/window'
import { WindowAltTabTaskItem } from '../type'

const { DwmGetWindowAttribute } = libDwmApi
const {
  EnumWindows,
  GetShellWindow,
  GetWindowLongA,
  GetAncestor,
  GetLastActivePopup,
  IsWindowVisible,
  GetWindowTextW,
  GetWindowThreadProcessId,
  ShowWindow,
  SetForegroundWindow,
  PostMessageW
} = libUser32Api
const { OpenProcess, CloseHandle, QueryFullProcessImageNameW } = libProcessThreadsApi

// 窗口是否被其所有者应用程序遮盖（DWMWA_CLOAKED = 14）
const isCloakedWindow = (hwnd: number) => {
  const value: number[] = [0]
  const hr = DwmGetWindowAttribute(hwnd, 14, value, 4)
  if (hr !== 0) return false
  return !!value[0]
}

const getLastVisibleActivePopUpOfWindow = (hwnd: number): number | null => {
  while (true) {
    // 确定指定窗口拥有的弹出窗口最近处于活动状态
    const h: number = GetLastActivePopup(hwnd)

    // 确定指定窗口的可见性状态
    if (IsWindowVisible(h)) {
      return h
    } else if (h === hwnd) {
      return null
    }

    hwnd = h
  }
}

const isAltTabWindows = (hwnd: number) => {
  // 是否是 shell 桌面窗口
  if (GetShellWindow() === hwnd) return false

  if (isCloakedWindow(hwnd)) return false

  const ex = GetWindowLongA(hwnd, -20)
  // 去除浮动工具栏（WS_EX_TOOLWINDOW = 0x80）
  if (ex & 0x00000080) return false

  // 检索指定窗口的上级句柄
  const hRoot = GetAncestor(hwnd, 3)
  const hLast = getLastVisibleActivePopUpOfWindow(hRoot)

  if (hLast !== hwnd) return false

  return true
}

// 取窗口所属进程 PID（32 位 DWORD，用单元素数组接收 _Out_ 参数）
const getWindowPid = (hwnd: number): number => {
  const pidPtr: number[] = [0]
  GetWindowThreadProcessId(hwnd, pidPtr)
  return pidPtr[0]
}

// 通过 PID 拿到对应进程的可执行文件路径
const fillProcessName = (pid: number, altTabItemInfo: WindowAltTabTaskItem) => {
  // PROCESS_QUERY_LIMITED_INFORMATION = 0x1000，权限要求低，覆盖更多进程
  const processHandle = OpenProcess(0x1000, false, pid)
  if (!processHandle) return

  try {
    // W 版直接拿 UTF-16，按 utf16le 解码，避免 ANSI 代码页丢字（如路径含中文用户名）
    const CAP = 512 // 字符数
    const nameBuf = Buffer.allocUnsafe(CAP * 2)
    const sizePtr: number[] = [CAP]
    const ok = QueryFullProcessImageNameW(processHandle, 0, nameBuf, sizePtr)
    if (ok) {
      // sizePtr 写回字符数（不含 \0）；UTF-16 每字符 2 字节
      altTabItemInfo.processName = nameBuf.toString('utf16le', 0, sizePtr[0] * 2)
    }
  } finally {
    // 关键：用完必须关闭句柄，否则每轮枚举都会泄漏句柄
    CloseHandle(processHandle)
  }
}

/**
 * 同步枚举所有顶层窗口，筛出 alt-tab 任务。
 *
 * EnumWindows 是同步 API，回调在当前线程同步执行，结果可靠（不再有跨线程竞态）。
 */
const getAllInfo = (): Promise<Array<WindowAltTabTaskItem>> => {
  return new Promise((resolve, reject) => {
    const result: Array<WindowAltTabTaskItem> = []

    const cb = koffi.register((hwnd: number) => {
      if (!isAltTabWindows(hwnd)) return true

      const pid = getWindowPid(hwnd)
      // 跳过本应用自身的窗口（Electron 窗口由主进程创建，PID 即 process.pid）
      if (!pid || pid === process.pid) return true

      // W 版取标题，原样拿 UTF-16，不经 ANSI 代码页转换（避免中文变成 ????）
      const CAP = 512 // 标题最大字符数，足够覆盖正常窗口标题
      const buf = Buffer.allocUnsafe(CAP * 2)
      const len = GetWindowTextW(hwnd, buf, CAP)
      if (len <= 0) return true

      const finalStr = buf.toString('utf16le', 0, len * 2)
      if (!finalStr) return true

      const altTabItemInfo: WindowAltTabTaskItem = {
        appTitle: finalStr,
        appHwnd: hwnd,
        processName: ''
      }
      fillProcessName(pid, altTabItemInfo)
      result.push(altTabItemInfo)

      return true
    }, koffi.pointer(EnumWindowsProc))

    try {
      EnumWindows(cb, 0)
      resolve(result)
    } catch (e) {
      reject(e)
    } finally {
      koffi.unregister(cb)
    }
  })
}

const toggleWindow = (appHwnd: number) => {
  ShowWindow(appHwnd, 1)
  SetForegroundWindow(appHwnd)
}

// 优雅关闭目标窗口：投递 WM_CLOSE（等同点窗口的 ✕，触发应用自身的保存提示等），
// 不强杀进程。若是该进程最后一个窗口，进程会自然退出。
const WM_CLOSE = 0x0010
const closeWindow = (appHwnd: number) => {
  PostMessageW(appHwnd, WM_CLOSE, 0, 0)
}

export { getAllInfo, toggleWindow, closeWindow }
