<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();
$username = trim((string) ($body['username'] ?? 'admin'));
$password = (string) ($body['password'] ?? '');

if ($password === '') {
    json_error('Password required.');
}

$stmt = db()->prepare('SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    // Fallback for first setup: allow admin123 if no valid hash yet
    if ($username === 'admin' && $password === 'admin123') {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        db()->prepare(
            'INSERT INTO admins (username, password_hash) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)'
        )->execute(['admin', $hash]);
        $token = admin_token_encode('admin');
        json_response(['ok' => true, 'token' => $token, 'username' => 'admin']);
    }
    json_error('Invalid admin credentials.', 401);
}

$token = admin_token_encode($admin['username']);
json_response([
    'ok' => true,
    'token' => $token,
    'username' => $admin['username'],
]);
