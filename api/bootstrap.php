<?php
/**
 * Shared helpers: PDO, JSON responses, CORS, IDs
 */

declare(strict_types=1);

function app_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $c = app_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $c['host'],
        $c['dbname'],
        $c['charset']
    );

    $pdo = new PDO($dsn, $c['username'], $c['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}

function cors(): void
{
    $origin = app_config()['cors_origin'] ?? '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response(mixed $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400): void
{
    json_response(['ok' => false, 'error' => $message], $status);
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function new_id(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(6));
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/&/', 'and', $value) ?? $value;
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? $value;
    return trim($value, '-') ?: 'item';
}

function normalize_phone(string $phone): string
{
    return preg_replace('/\D+/', '', $phone) ?? '';
}

function normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function require_admin(): void
{
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $headerToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';

    $token = '';
    if (preg_match('/Bearer\s+(\S+)/i', $auth, $m)) {
        $token = $m[1];
    } elseif ($headerToken !== '') {
        $token = $headerToken;
    }

    if ($token === '' || admin_token_decode($token) === null) {
        json_error('Unauthorized — admin login required', 401);
    }
}

function admin_token_encode(string $username): string
{
    $secret = app_config()['admin_secret'];
    $payload = base64_encode(json_encode([
        'u' => $username,
        'exp' => time() + 60 * 60 * 12,
    ], JSON_THROW_ON_ERROR));
    $sig = hash_hmac('sha256', $payload, $secret);
    return $payload . '.' . $sig;
}

function admin_token_decode(string $token): ?array
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return null;
    }
    [$payload, $sig] = $parts;
    $secret = app_config()['admin_secret'];
    $check = hash_hmac('sha256', $payload, $secret);
    if (!hash_equals($check, $sig)) {
        return null;
    }
    $data = json_decode(base64_decode($payload, true) ?: '', true);
    if (!is_array($data) || ($data['exp'] ?? 0) < time()) {
        return null;
    }
    return $data;
}
