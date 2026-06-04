import koffi from 'koffi'
import iconv from 'iconv-lite'
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
  GetWindowTextA,
  GetWindowTextLengthA,
  GetWindowThreadProcessId,
  ShowWindow,
  SetForegroundWindow
} = libUser32Api
const { OpenProcess, CloseHandle, QueryFullProcessImageNameA } = libProcessThreadsApi

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
    const nameBuf = Buffer.allocUnsafe(512)
    const sizePtr: number[] = [512]
    const ok = QueryFullProcessImageNameA(processHandle, 0, nameBuf, sizePtr)
    if (ok) {
      // size 写回实际字符数（不含结尾 \0）。用原始字节按 GBK 解码，避免 koffi 默认 UTF-8 乱码
      altTabItemInfo.processName = iconv.decode(nameBuf.subarray(0, sizePtr[0]), 'gbk')
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

      const length = GetWindowTextLengthA(hwnd)
      if (length <= 0) return true

      // +1 给结尾的 \0 留位，避免越界写
      const buf = Buffer.allocUnsafe(length + 1)
      GetWindowTextA(hwnd, buf, length + 1)

      // 原始字节按 GBK 解码（Win32 *A 接口在中文系统返回 GBK）
      const finalStr = iconv.decode(buf.subarray(0, length), 'gbk')
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

export { getAllInfo, toggleWindow }
