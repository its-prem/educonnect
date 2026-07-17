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

// Strip everything up to and including the first `/api`
// Works at domain root (/api/health) and in a subfolder (/educonnect/api/health)
$path = preg_replace('#^.*?/api#', '', $path) ?? $path;
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

        // Student contribution / change request (photos + edits → pending)
        $method === 'POST' && preg_match('#^/colleges/([^/]+)/contributions$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/contributions_create.php';
        })(),

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

        // Admin — student contributions (change requests) & registered students
        $method === 'GET' && $path === '/admin/contributions' => require __DIR__ . '/endpoints/contributions_list.php',
        $method === 'POST' && preg_match('#^/admin/contributions/([^/]+)/update$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/contributions_update.php';
        })(),
        $method === 'POST' && preg_match('#^/admin/contributions/([^/]+)/approve$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/contributions_approve.php';
        })(),
        $method === 'POST' && preg_match('#^/admin/contributions/([^/]+)/reject$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/contributions_reject.php';
        })(),
        $method === 'GET' && $path === '/admin/students' => require __DIR__ . '/endpoints/students_list.php',
        $method === 'POST' && preg_match('#^/admin/students/([^/]+)/update$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/students_update.php';
        })(),
        $method === 'POST' && preg_match('#^/admin/students/([^/]+)/delete$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/students_delete.php';
        })(),

        // Admin — catalog management (streams / programs / colleges CRUD)
        $method === 'POST' && $path === '/admin/streams' => require __DIR__ . '/endpoints/streams_create.php',
        $method === 'POST' && preg_match('#^/admin/streams/([^/]+)/delete$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/streams_delete.php';
        })(),
        $method === 'POST' && $path === '/admin/programs' => require __DIR__ . '/endpoints/programs_create.php',
        $method === 'POST' && preg_match('#^/admin/programs/([^/]+)/delete$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/programs_delete.php';
        })(),
        $method === 'POST' && preg_match('#^/admin/colleges/([^/]+)/update$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/colleges_update.php';
        })(),
        $method === 'POST' && preg_match('#^/admin/colleges/([^/]+)/delete$#', $path, $m) === 1 => (function () use ($m) {
            $_GET['id'] = urldecode($m[1]);
            require __DIR__ . '/endpoints/colleges_delete.php';
        })(),

        default => json_error('Not found: ' . $method . ' ' . $path, 404),
    };
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}
