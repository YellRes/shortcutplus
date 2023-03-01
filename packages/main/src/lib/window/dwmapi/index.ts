import ffi from 'ffi-napi'
import { windowType } from '../index'

const { PVOID, HRESULT, HANDLE, Def } = windowType
const libDwmApi = new ffi.Library('dwmapi.dll', {
  DwmRegisterThumbnail: [HRESULT, [HANDLE, HANDLE, PVOID]],
  DwmGetWindowAttribute: [HRESULT, [HANDLE, HANDLE, PVOID, HANDLE]]
})

export default libDwmApi
