<?php
/**
 * EduConnect API router
 * Upload the `api` folder to Hostinger public_html/api/
 * Example: https://yoursite.com/api/students/register
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';

// Strip /api prefix if present
$path = preg_replace('#^/api#', '', $path) ?? $path;
$path = '/' . trim($path, '/');

try {
    match (true) {
        // Health
        $path === '/' || $path === '/health' => json_response(['ok' => true, 'service' => 'educonnect-api']),

        // Students
        $method === 'POST' && $path === '/students/register' => require __DIR__ . '/endpoints/students_register.php',
        $method === 'POST' && $path === '/students/login' => require __DIR__ . '/endpoints/students_login.php',

        // College accounts
        $method === 'POST' && $path === '/college-accounts/register' => require __DIR__ . '/endpoints/college_accounts_register.php',
        $method === 'POST' && $path === '/college-accounts/login' => require __DIR__ . '/endpoints/college_accounts_login.php',

        // Catalog (public)
        $method === 'GET' && $path === '/streams' => require __DIR__ . '/endpoints/streams_list.php',
        $method === 'GET' && $path === '/programs' => require __DIR__ . '/endpoints/programs_list.php',
        $method === 'GET' && $path === '/colleges' => require __DIR__ . '/endpoints/colleges_list.php',
        $method === 'GET' && preg_match('#^/colleges/([^/]+)$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['slug'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/colleges_get.php';
        })(),

        // College listing request (student → pending)
        $method === 'POST' && $path === '/colleges' => require __DIR__ . '/endpoints/colleges_submit.php',

        // Applications
        $method === 'POST' && $path === '/applications' => require __DIR__ . '/endpoints/applications_create.php',
        $method === 'GET' && $path === '/applications' => require __DIR__ . '/endpoints/applications_list.php',

        // Admin
        $method === 'POST' && $path === '/admin/login' => require __DIR__ . '/endpoints/admin_login.php',
        $method === 'GET' && $path === '/admin/pending-colleges' => require __DIR__ . '/endpoints/admin_pending.php',
        $method === 'POST' && preg_match('#^/admin/colleges/([^/]+)/approve$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/admin_approve.php';
        })(),
        $method === 'POST' && preg_match('#^/admin/colleges/([^/]+)/reject$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/admin_reject.php';
        })(),

        default => json_error('Not found: ' . $method . ' ' . $path, 404),
    };
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}
