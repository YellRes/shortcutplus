import ffi from 'ffi-napi'
import { windowType } from '../index'

const { Def, HANDLE } = windowType

const libProcessThreadApi = ffi.Library('kernel32', {
  OpenProcess: [HANDLE, [HANDLE, Def.int, HANDLE]]
})

export default libProcessThreadApi
