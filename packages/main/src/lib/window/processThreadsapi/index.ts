import ffi from 'ffi-napi'
import { windowType } from '../index'

const { Def, HANDLE } = windowType

const libProcessThreadApi = new ffi.Library('kernel32.dll', {
  OpenProcess: [HANDLE, [HANDLE, Def.int, HANDLE]]
})

export default libProcessThreadApi
