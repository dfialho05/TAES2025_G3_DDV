<?php

return [
    "paths" => [
        "api/*",
        "sanctum/csrf-cookie",
        "login",
        "logout",
        "register",
        "broadcasting/auth",
    ],
    "allowed_methods" => ["*"],
    "allowed_origins" => ["*"],
    "allowed_headers" => ["*"],
    "exposed_headers" => [],
    "max_age" => 0,
    "supports_credentials" => true,
];
