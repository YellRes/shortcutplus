/**
 * Q-A:
 * Q: node 中 typescript 的使用
 */

import ffi from 'ffi-napi'

import { windowType } from '../index'

const { Def, BOOL, POINTER, LONG_PTR } = windowType
const libUser32 = ffi.Library('user32', {
  EnumWindows: [BOOL, [POINTER, LONG_PTR]],
  GetShellWindow: [POINTER, []],
  GetWindowLong: []
})

export default libUser32
