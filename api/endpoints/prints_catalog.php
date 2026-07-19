<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

require_student();

$stmt = db()->query(
    'SELECT id, title, price_per_credit, enabled, created_at, updated_at
     FROM print_pdfs WHERE enabled = 1 ORDER BY created_at DESC'
);
$rows = $stmt->fetchAll();

json_response([
    'ok' => true,
    'pdfs' => array_map(static fn (array $r) => print_map_pdf($r), $rows),
]);
