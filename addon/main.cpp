#include <napi.h>
#include <dwmapi.h>
#include <winuser.h>

#pragma comment(lib, "dwmapi.lib")

namespace getThumbnail
{
    void GetThumbnail();
    // HWND GetThumbnail();
    void GetThumbnailWrapped(const Napi::CallbackInfo &info);
    Napi::Object Init(Napi::Env env, Napi::Object exports);
}

void getThumbnail::GetThumbnail()
{
    // HRESULT hr = 0;
    // SIZE size = {100, 100};
    // HTHUMBNAIL thumbnail = NULL;

    // HWND targetHwnd = FindWindowA(NULL, "Vite + Vue + TS");
    // HWND sourceHwnd = FindWindowA(NULL, "New Tab - Google Chrome);

    // hr = DwmRegisterThumbnail(targetHwnd, sourceHwnd, &size, &thumbnail);

    // if (SUCCEEDED(hr))
    // {
    //     RECT dest = {100, 50, 100, 150};

    //     DWM_THUMBNAIL_PROPERTIES dskThumbProps;
    //     dskThumbProps.dwFlags = DWM_TNP_SOURCECLIENTAREAONLY | DWM_TNP_VISIBLE | DWM_TNP_OPACITY | DWM_TNP_RECTDESTINATION;
    //     dskThumbProps.fSourceClientAreaOnly = FALSE;
    //     dskThumbProps.fVisible = TRUE;
    //     dskThumbProps.opacity = (255 * 70) / 100;
    //     dskThumbProps.rcDestination = dest;

    //     hr = DwmUpdateThumbnailProperties(thumbnail, &dskThumbProps);
    // }

    // return hr

    // 1. 获取窗口句柄并创建设备上下文
    HWND hwnd = FindWindow(NULL, "Target Window");
    HDC hdcScreen = CreateDC("DISPLAY", NULL, NULL, NULL);
    HDC hdcMem = CreateCompatibleDC(hdcScreen);
    HDC hdcCompat = CreateCompatibleDC(hdcScreen);

    // 2. 调用 PrintWindow 获取窗口截图
    PrintWindow(hwnd, hdcCompat, 0);

    // 3. 获取位图信息和数据
    BITMAPINFO bi;
    ZeroMemory(&bi, sizeof(bi));
    bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    GetDIBits(hdcCompat, (HBITMAP)GetCurrentObject(hdcCompat, OBJ_BITMAP),
              0, 0, NULL, &bi, DIB_RGB_COLORS);
    BYTE *bits = new BYTE[bi.bmiHeader.biSizeImage];
    GetDIBits(hdcCompat, (HBITMAP)GetCurrentObject(hdcCompat, OBJ_BITMAP),
              0, bi.bmiHeader.biHeight, bits, &bi, DIB_RGB_COLORS);

    // 4. 将位图数据转换为 base64
    int rawLen = bi.bmiHeader.biSizeImage;
    BYTE *rawData = bits;
    // char *base64 = base64_encode(rawData, rawLen);

    return bits

    // 5. 释放资源
    // DeleteDC(hdcScreen);
    // DeleteDC(hdcMem);
    // DeleteDC(hdcCompat);
    // delete[] bits;
}

void getThumbnail::GetThumbnailWrapped(const Napi::CallbackInfo &info)
{

    Napi::Env env = info.Env();

    getThumbnail::GetThumbnail();
}

Napi::Object getThumbnail::Init(Napi::Env env, Napi::Object exports)
{
    exports.Set("getThumbnail", Napi::Function::New(env, getThumbnail::GetThumbnailWrapped));

    return exports;
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
    // return exports;
    // return functionexample::Init(env, exports);
    return getThumbnail::Init(env, exports);
}

NODE_API_MODULE(testaddon, InitAll);