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
  // 标题用 W(宽字符) 版：写入 UTF-16 到 uint16_t* 缓冲，原样返回 Unicode，
  // 不经 ANSI 代码页转换（否则中文等会被替换成字面量 ?）
  GetWindowTextW: user32.func(
    'int __stdcall GetWindowTextW(uintptr_t hwnd, _Out_ uint16_t *str, int maxCount)'
  ),
  GetWindowThreadProcessId: user32.func(
    'uint32_t __stdcall GetWindowThreadProcessId(uintptr_t hwnd, _Out_ uint32_t *pid)'
  ),
  ShowWindow: user32.func('bool __stdcall ShowWindow(uintptr_t hwnd, int cmd)'),
  SetForegroundWindow: user32.func('bool __stdcall SetForegroundWindow(uintptr_t hwnd)')
}

export default libUser32
