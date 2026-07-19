<?php
/**
 * Copy to config.php and fill Hostinger MySQL credentials.
 */

declare(strict_types=1);

return [
    'host'     => 'localhost',
    'dbname'   => 'uXXXX_educonnect',
    'username' => 'uXXXX_educonnect',
    'password' => 'YOUR_PASSWORD',
    'charset'  => 'utf8',

    // Set to your Netlify URL after deploy, e.g. https://educonnect.netlify.app
    'cors_origin' => '*',

    'admin_secret' => 'change-this-secret-key',

    // Frontend origin (Cashfree return URL)
    'frontend_url' => 'http://localhost:5173',

    // Public API base used for Cashfree webhook notify_url, e.g. https://diplomawallah.in/educonnect/api
    'api_public_url' => '',

    // AES key material for encrypted PDF storage (any long string)
    'print_encryption_key' => 'change-this-print-encryption-key',

    // Cashfree PG — copy real keys into config.php only (never commit secrets)
    // env: mock | sandbox | production
    'cashfree' => [
        'env' => 'sandbox',
        'app_id' => '',
        'secret_key' => '',
        'webhook_secret' => '',
    ],
];
