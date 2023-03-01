{
    "targets": [
        {
            "target_name": "testAddon",
            "cflags!": [ "-fno-exceptions" ],
            "cflags_cc!": [ "-fno-exceptions" ],
            "sources": [
                "addon/main.cpp"
            ],
            "include_dirs": [
				"<!@(node -p \"require('node-addon-api').include\")",
			],
            'libraries': [
                "dwmapi.lib",
                "user32.lib"
            ],
             'dependencies': [
                "<!(node -p \"require('node-addon-api').gyp\")"
            ],
            'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]

        }
    ]
}