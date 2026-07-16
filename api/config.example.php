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
    'charset'  => 'utf8mb4',

    // Set to your Netlify URL after deploy, e.g. https://educonnect.netlify.app
    'cors_origin' => '*',

    'admin_secret' => 'change-this-secret-key',
];
