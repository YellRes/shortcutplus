/**
 * Q-A:
 * Q: node 中 typescript 的使用
 */

import ffi from 'ffi-napi'
import { windowType } from '../index'

const { Def, BOOL, POINTER, LONG_PTR, HANDLE } = windowType
const libUser32 = ffi.Library('user32', {
  EnumWindows: [BOOL, [POINTER, LONG_PTR]],
  GetShellWindow: [POINTER, []],
  GetWindowLongA: [HANDLE, [HANDLE, Def.int]],
  GetAncestor: [HANDLE, [HANDLE, Def.uint]],
  GetLastActivePopup: [HANDLE, [HANDLE]],
  IsWindowVisible: [BOOL, [HANDLE]],
  GetWindowTextA: [Def.int, [HANDLE, Def.uint16Ptr, Def.int]],
  GetWindowTextLengthA: [Def.int, [Def.int]],
  GetWindowThreadProcessId: [Def.int, [HANDLE, Def.uint16Ptr]],
  GetWindowModuleFileNameA: ['int', [HANDLE, 'uchar*', 'int']],
  ShowWindow: [Def.bool, [HANDLE, 'int']]
})

export default libUser32
