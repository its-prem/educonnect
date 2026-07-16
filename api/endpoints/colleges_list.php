<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

$status = $_GET['status'] ?? 'approved';
$allowed = ['approved', 'pending', 'rejected', 'all'];
if (!in_array($status, $allowed, true)) {
    $status = 'approved';
}

$pdo = db();

if ($status === 'all') {
    $rows = $pdo->query('SELECT * FROM colleges ORDER BY created_at DESC')->fetchAll();
} else {
    $stmt = $pdo->prepare('SELECT * FROM colleges WHERE approval_status = ? ORDER BY created_at DESC');
    $stmt->execute([$status]);
    $rows = $stmt->fetchAll();
}

$colleges = array_map(
    static fn(array $row): array => fetch_college_bundle($pdo, $row),
    $rows
);

json_response(['ok' => true, 'colleges' => $colleges]);
