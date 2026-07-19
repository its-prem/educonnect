<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

// Public catalog — PDF cards + price (no file access)
try {
    $stmt = db()->query(
        'SELECT id, title, price_per_credit, enabled, created_at, updated_at
         FROM print_pdfs WHERE enabled = 1 ORDER BY created_at DESC'
    );
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    json_error(
        'Print tables missing. Import migrate_prints.sql in phpMyAdmin. (' . $e->getMessage() . ')',
        500,
    );
}

json_response([
    'ok' => true,
    'pdfs' => array_map(static fn (array $r) => print_map_pdf($r), $rows),
]);
