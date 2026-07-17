<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();
$username = trim((string) ($body['username'] ?? 'admin'));
$password = (string) ($body['password'] ?? '');

if ($password === '') {
    json_error('Password required.');
}

$expectedPassword = '7250754032';

if ($username !== 'admin' || $password !== $expectedPassword) {
    json_error('Invalid admin credentials.', 401);
}

$hash = password_hash($expectedPassword, PASSWORD_DEFAULT);
db()->prepare(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)'
)->execute(['admin', $hash]);

$token = admin_token_encode('admin');
json_response([
    'ok' => true,
    'token' => $token,
    'username' => 'admin',
]);
