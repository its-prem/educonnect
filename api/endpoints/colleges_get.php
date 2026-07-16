<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

$slug = trim((string) ($_GET['slug'] ?? ''));
if ($slug === '') {
    json_error('College slug required', 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM colleges WHERE slug = ? LIMIT 1');
$stmt->execute([$slug]);
$row = $stmt->fetch();

if (!$row) {
    json_error('College not found', 404);
}

// Public users only see approved; admin can pass ?admin=1 with token later
if ($row['approval_status'] !== 'approved') {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = preg_match('/Bearer\s+(\S+)/i', $auth, $m) ? $m[1] : '';
    if ($token === '' || admin_token_decode($token) === null) {
        json_error('College under review', 403);
    }
}

json_response([
    'ok' => true,
    'college' => fetch_college_bundle($pdo, $row),
]);
