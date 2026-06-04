import koffi from 'koffi'

const dwmapi = koffi.load('dwmapi.dll')

const libDwmApi = {
  // 读取窗口属性（这里只用 DWMWA_CLOAKED=14 判断窗口是否被遮盖）。
  // 返回 HRESULT(int)，属性值写入 uint32_t*。
  DwmGetWindowAttribute: dwmapi.func(
    'int __stdcall DwmGetWindowAttribute(uintptr_t hwnd, uint32_t attr, _Out_ uint32_t *value, uint32_t size)'
  )
}

export default libDwmApi
