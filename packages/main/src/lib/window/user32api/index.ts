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
  GetWindowLong: [HANDLE, [HANDLE, Def.int]],
  GetAncestor: [HANDLE, [HANDLE, Def.uint]],
  GetLastActivePopup: [HANDLE, [HANDLE]],
  IsWindowVisible: [BOOL, [HANDLE]],
  GetWindowThreadProcessId: [Def.int, [HANDLE, Def.uint16Ptr]],
  GetWindowTextA: [Def.int, [HANDLE, Def.uint16Ptr, Def.int]],
  GetWindowTextLengthA: [Def.int, [Def.int]]
})

export default libUser32
