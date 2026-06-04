import koffi from 'koffi'

const kernel32 = koffi.load('kernel32.dll')

const libProcessThreadApi = {
  OpenProcess: kernel32.func(
    'uintptr_t __stdcall OpenProcess(uint32_t access, bool inherit, uint32_t pid)'
  ),
  // 关闭 OpenProcess 返回的句柄，避免句柄泄漏
  CloseHandle: kernel32.func('bool __stdcall CloseHandle(uintptr_t handle)'),
  // 比 GetModuleFileNameExA 权限要求更低（配合 PROCESS_QUERY_LIMITED_INFORMATION），
  // 能覆盖更多受保护/管理员进程。name 写入原始字节，size 为 in/out 的 DWORD。
  QueryFullProcessImageNameA: kernel32.func(
    'bool __stdcall QueryFullProcessImageNameA(uintptr_t proc, uint32_t flags, _Out_ uint8_t *name, _Inout_ uint32_t *size)'
  )
}

export default libProcessThreadApi
