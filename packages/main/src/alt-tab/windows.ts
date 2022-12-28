import { libDwmApi, libUser32Api, libProcessThreadsApi, libPsApi, windowType } from '../lib/window'
import ref from 'ref-napi'
import iconv from 'iconv-lite'

const { Def, BOOL, HANDLE, LONG_PTR } = windowType
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
  GetWindowThreadProcessId
} = libUser32Api
const { OpenProcess } = libProcessThreadsApi
const { GetModuleFileNameExA, GetModuleFileNameExW } = libPsapi

const _WIN64 = process.arch === 'x64'

const isCloakedWindow = (hwnd: number) => {
  const buf = Buffer.alloc(1000)
  buf.type = _WIN64 ? ref.types.uint64 : ref.types.uint32
  // 查看 窗口是否被其所有者应用程序遮盖
  const res = DwmGetWindowAttribute(hwnd, 1, buf, 10000)

  return !res
}

const getLastVisibleActivePopUpOfWindow = (hwnd: number) => {
  while (true) {
    // 确定指定窗口拥有的弹出窗口最近处于活动状态。
    /**
     * 由 hWnd 标识的窗口最近处于活动状态。
     * 由 hWnd 标识的窗口不拥有任何弹出窗口。
     * 由 hWnd 标识的窗口不是顶级窗口，或者它由另一个窗口拥有。
     * */
    const h = GetLastActivePopup(hwnd)

    // 确定指定窗口的可见性状态
    // 指定的窗口、其父窗口、其父窗口等具有 WS_VISIBLE 样式，则返回值为非零。 否则返回值为零。
    // window 父窗口 顶级窗口 关系
    // TODO:
    // https://blog.csdn.net/lixiang987654321/article/details/25779373
    if (IsWindowVisible(h)) {
      return h
    } else if (h === hwnd) {
      return null
    }

    hwnd = h
  }
}

const isAltTabWindows = (hwnd: number) => {
  // 是否是shell 桌面窗口
  if (GetShellWindow() === hwnd) return false

  if (isCloakedWindow(hwnd)) {
    return false
  }

  const ex = GetWindowLongA(hwnd, -20)
  // 去除浮动工具栏
  if (ex & 0x00000080) return false

  // 检索指定窗口的上级句柄。
  const hRoot = GetAncestor(hwnd, 3)
  const hLast = getLastVisibleActivePopUpOfWindow(hRoot)

  if (hLast != hwnd) {
    return false
  }

  return true
}

const allAltTabProcess: Array<string> = []
const enumWindowsCallBack = ffi.Callback(BOOL, [HANDLE, LONG_PTR], (hwnd: number) => {
  const res = isAltTabWindows(hwnd)
  if (res) {
    const length: number = GetWindowTextLengthA(hwnd)
    const buf = Buffer.alloc(length)
    buf.type = ref.types.uchar
    GetWindowTextA(hwnd, buf, length + 1)
    const finalStr = iconv.decode(buf, 'gbk')
    allAltTabProcess.push(finalStr)
    // const processIdBuf = Buffer.alloc(1000)
    // processIdBuf.type = ref.types.uint16
    // GetWindowThreadProcessId(hwnd, processIdBuf)
    // 获取hwnd的进程名字
    // getProcessNameByHwnd(processIdBuf)
  }
})
const getAllInfo = () => {
  EnumWindows(enumWindowsCallBack, 0)

  return { allAltTabProcess }
}

export { getAllInfo }
