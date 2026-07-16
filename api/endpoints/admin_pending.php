<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

require_admin();

$pdo = db();
$stmt = $pdo->prepare(
    "SELECT * FROM colleges WHERE approval_status = 'pending' ORDER BY created_at ASC"
);
$stmt->execute();
$rows = $stmt->fetchAll();

$colleges = array_map(
    static fn(array $row): array => fetch_college_bundle($pdo, $row),
    $rows
);

json_response(['ok' => true, 'colleges' => $colleges, 'count' => count($colleges)]);
