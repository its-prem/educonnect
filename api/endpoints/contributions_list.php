<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

require_admin();

$status = $_GET['status'] ?? 'pending';
$allowed = ['pending', 'approved', 'rejected', 'all'];
if (!in_array($status, $allowed, true)) {
    $status = 'pending';
}

$pdo = db();
if ($status === 'all') {
    $rows = $pdo->query('SELECT * FROM college_contributions ORDER BY created_at DESC')->fetchAll();
} else {
    $stmt = $pdo->prepare('SELECT * FROM college_contributions WHERE status = ? ORDER BY created_at DESC');
    $stmt->execute([$status]);
    $rows = $stmt->fetchAll();
}

$contributions = array_map('contribution_bundle', $rows);

json_response(['ok' => true, 'contributions' => $contributions, 'count' => count($contributions)]);
