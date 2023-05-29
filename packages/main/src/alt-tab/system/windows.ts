import ref from 'ref-napi'
import iconv from 'iconv-lite'
import ffi from 'ffi-napi'
import {
  libDwmApi,
  libUser32Api,
  libProcessThreadsApi,
  windowType,
  libPsApi
} from '../../lib/window'
import { WindowAltTabTaskItem } from '../type'

const { Def, BOOL, HANDLE, LONG_PTR } = windowType
const { DwmGetWindowAttribute, DwmRegisterThumbnail } = libDwmApi
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
  ShowWindow
} = libUser32Api

// Q-A: SetForegroundWindow 放到 libUser32Api 导入后 会出现中文乱码情况
const { SetForegroundWindow } = ffi.Library('user32', {
  SetForegroundWindow: [BOOL, [HANDLE]]
})
const { OpenProcess } = libProcessThreadsApi
const { GetModuleFileNameExA } = libPsApi

const _WIN64 = process.arch === 'x64'

const isCloakedWindow = (hwnd: number) => {
  const buf = Buffer.alloc(200)
  buf.type = _WIN64 ? ref.types.uint64 : ref.types.uint32
  // 查看 窗口是否被其所有者应用程序遮盖
  const res = DwmGetWindowAttribute(hwnd, 14, buf, 200)

  let cloakedWindow = buf.deref()
  if (res != 0) cloakedWindow = false

  return cloakedWindow
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

const getProcessNameByHwnd = (pid: number, altTabItemInfo: WindowAltTabTaskItem) => {
  const processHandle = OpenProcess(0x0400 | 0x0010, 0, pid)

  const processNameBuf = Buffer.alloc(200)
  processNameBuf.type = ref.types.uchar
  GetModuleFileNameExA(processHandle, 0, processNameBuf, 200)
  altTabItemInfo.processName = iconv.decode(processNameBuf, 'gbk').replace(/(\x00)*/gm, '')
}

let allAltTabProcess: Array<WindowAltTabTaskItem> = []
const enumWindowsCallBack = ffi.Callback(BOOL, [HANDLE, LONG_PTR], (hwnd: number, IParam) => {
  const res = isAltTabWindows(hwnd)
  if (res) {
    const length: number = GetWindowTextLengthA(hwnd)

    const buf = Buffer.alloc(length)
    buf.type = ref.types.uchar
    GetWindowTextA(hwnd, buf, length + 1)

    const finalStr = iconv.decode(buf, 'GBK')
    const altTabItemInfo = {
      appTitle: finalStr,
      appHwnd: hwnd,
      processName: ''
    }

    // Q-A:  finalStr 字符串异常
    // A: user32 导入函数的问题
    if (finalStr) allAltTabProcess.push(altTabItemInfo)

    const processIdBuf = Buffer.alloc(200)
    processIdBuf.type = ref.types.uint16
    GetWindowThreadProcessId(hwnd, processIdBuf)
    // 获取hwnd的进程名字
    getProcessNameByHwnd(processIdBuf.deref(), altTabItemInfo)
  }

  return true
})
/**
 * allAltTabProcess
 * EnumWindows 是个异步函数
 */
const getAllInfo = () =>
  new Promise((res, rej) => {
    allAltTabProcess = []
    EnumWindows.async(enumWindowsCallBack, 0, (err) => {
      if (err) return rej(err)
      return res(allAltTabProcess)
    })
  })

const toggleWindow = (appHwnd: number) => {
  ShowWindow(appHwnd, 1)
  SetForegroundWindow(appHwnd)
}

const getWindowCurrentProcessThumbnail = (hwnd: number, sourceHwnd: number) => {
  // TODO: 定义buffer的时候 该buffer该定义多大
  // int类型一般是4个字节 Buffer.alloc(4)
  const thumbBuf = Buffer.alloc(8)

  // TODO: thumbPtr Pointer<number> 如何在node中展示
  DwmRegisterThumbnail(hwnd, sourceHwnd, thumbBuf)
  // node-ffi 中如何定义window中系统中的类型

  return thumbBuf
}

export { getAllInfo, toggleWindow, getWindowCurrentProcessThumbnail }
