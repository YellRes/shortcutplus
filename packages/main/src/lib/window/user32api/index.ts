import koffi from 'koffi'

const user32 = koffi.load('user32.dll')

// EnumWindows 回调原型。CALLBACK = __stdcall（x64 下被忽略，x86 下必需）。
// hwnd 用 uintptr_t（数字句柄），便于比较、经 IPC 传给渲染层、匹配缩略图。
export const EnumWindowsProc = koffi.proto(
  'bool __stdcall EnumWindowsProc(uintptr_t hwnd, intptr_t lparam)'
)

const libUser32 = {
  EnumWindows: user32.func('bool __stdcall EnumWindows(void *proc, intptr_t lparam)'),
  GetShellWindow: user32.func('uintptr_t __stdcall GetShellWindow()'),
  GetWindowLongA: user32.func('long __stdcall GetWindowLongA(uintptr_t hwnd, int index)'),
  GetAncestor: user32.func('uintptr_t __stdcall GetAncestor(uintptr_t hwnd, uint gaFlags)'),
  GetLastActivePopup: user32.func('uintptr_t __stdcall GetLastActivePopup(uintptr_t hwnd)'),
  IsWindowVisible: user32.func('bool __stdcall IsWindowVisible(uintptr_t hwnd)'),
  // 标题写入原始字节缓冲（uint8_t*），由调用方用 iconv 按 GBK 解码
  GetWindowTextA: user32.func(
    'int __stdcall GetWindowTextA(uintptr_t hwnd, _Out_ uint8_t *str, int maxCount)'
  ),
  GetWindowTextLengthA: user32.func('int __stdcall GetWindowTextLengthA(uintptr_t hwnd)'),
  GetWindowThreadProcessId: user32.func(
    'uint32_t __stdcall GetWindowThreadProcessId(uintptr_t hwnd, _Out_ uint32_t *pid)'
  ),
  ShowWindow: user32.func('bool __stdcall ShowWindow(uintptr_t hwnd, int cmd)'),
  SetForegroundWindow: user32.func('bool __stdcall SetForegroundWindow(uintptr_t hwnd)')
}

export default libUser32
