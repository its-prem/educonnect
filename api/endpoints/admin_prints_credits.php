<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
$body = read_json_body();
$delta = (int) ($body['delta'] ?? 0);

if ($id === '') {
    json_error('Purchase id required.');
}
if ($delta === 0) {
    json_error('delta must be a non-zero integer (positive to add, negative to remove).');
}

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM print_purchases WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        $pdo->rollBack();
        json_error('Purchase not found.', 404);
    }

    $newTotal = (int) $row['credits_total'] + $delta;
    if ($newTotal < (int) $row['credits_used']) {
        $pdo->rollBack();
        json_error('Cannot set total credits below used prints.');
    }
    if ($newTotal < 0) {
        $pdo->rollBack();
        json_error('Total credits cannot be negative.');
    }

    $pdo->prepare(
        'UPDATE print_purchases SET credits_total = ?, updated_at = NOW() WHERE id = ?'
    )->execute([$newTotal, $id]);

    $pdo->commit();
    $stmt->execute([$id]);
    $row = $stmt->fetch();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error($e->getMessage(), 500);
}

$pdf = db()->prepare('SELECT title FROM print_pdfs WHERE id = ?');
$pdf->execute([$row['pdf_id']]);
$pdfRow = $pdf->fetch() ?: ['title' => ''];

json_response([
    'ok' => true,
    'purchase' => print_map_purchase($row, $pdfRow),
]);
