import ffi from 'ffi-napi'
import { windowType } from '../index'

const { PVOID, HRESULT, HANDLE } = windowType
const libDwmApi = new ffi.Library('dwmapi.dll', {
  DwmGetWindowAttribute: [HRESULT, [HANDLE, HANDLE, PVOID, HANDLE]]
})

export default libDwmApi
