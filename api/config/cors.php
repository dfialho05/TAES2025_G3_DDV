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
    "allowed_origins" => ["*"], // Ou coloca 'http://localhost:5173' para maior segurança
    "allowed_origins_patterns" => [],
    "allowed_headers" => ["*"],
    "exposed_headers" => [],
    "max_age" => 0,
    "supports_credentials" => true,
];
