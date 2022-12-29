import ffi from 'ffi-napi'
import { windowType } from '../index'

const { Def, HANDLE } = windowType

const libPsApi = new ffi.Library('psapi.dll', {
  GetModuleFileNameExA: [HANDLE, [HANDLE, HANDLE, Def.charPtr, HANDLE]]
})

export default libPsApi
