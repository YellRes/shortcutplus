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
    HRESULT hr = 0;
    HTHUMBNAIL thumbnail = NULL;

    HWND targetHwnd = FindWindowA(NULL, "Vite + Vue + TS");
    HWND sourceHwnd = FindWindowA(NULL, "shortcutsplus - Visual Studio Code");

    hr = DwmRegisterThumbnail(targetHwnd, sourceHwnd, &thumbnail);

    if (SUCCEEDED(hr))
    {
        /**
         * TODO: 如何设置 缩略图 的位置
         * */
        RECT dest = {0, 50, 100, 150};

        DWM_THUMBNAIL_PROPERTIES dskThumbProps;
        dskThumbProps.dwFlags = DWM_TNP_SOURCECLIENTAREAONLY | DWM_TNP_VISIBLE | DWM_TNP_OPACITY | DWM_TNP_RECTDESTINATION;
        dskThumbProps.fSourceClientAreaOnly = FALSE;
        dskThumbProps.fVisible = TRUE;
        dskThumbProps.opacity = (255 * 70) / 100;
        dskThumbProps.rcDestination = dest;

        hr = DwmUpdateThumbnailProperties(thumbnail, &dskThumbProps);
    }

    // return hr
}

void getThumbnail::GetThumbnailWrapped(const Napi::CallbackInfo &info)
{

    Napi::Env env = info.Env();
    // if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsNumber())
    // {
    //     Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
    // }

    // Napi::Number first = info[0].As<Napi::Number>();
    // Napi::Number second = info[1].As<Napi::Number>();
    // Napi::Number third = info[2].As<Napi::Value>();

    // int returnValue = getThumbnail::GetThumbnail(first.Int32Value(), second.Int32Value());

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