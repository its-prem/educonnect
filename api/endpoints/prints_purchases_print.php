<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

$auth = require_student();
$purchaseId = trim((string) ($_GET['id'] ?? ''));
$body = read_json_body();
$printerName = trim((string) ($body['printerName'] ?? $body['printer_name'] ?? 'Browser Print'));

if ($purchaseId === '') {
    json_error('Purchase id required.');
}

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'SELECT p.*, pdf.title AS pdf_title, pdf.enabled
         FROM print_purchases p
         JOIN print_pdfs pdf ON pdf.id = p.pdf_id
         WHERE p.id = ? AND p.student_id = ? AND p.status = \'paid\'
         LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([$purchaseId, $auth['sid']]);
    $row = $stmt->fetch();
    if (!$row) {
        $pdo->rollBack();
        json_error('Purchase not found.', 404);
    }
    if ((int) $row['enabled'] !== 1) {
        $pdo->rollBack();
        json_error('This PDF is currently disabled.', 403);
    }

    $remaining = print_purchase_remaining($row);
    if ($remaining < 1) {
        $pdo->rollBack();
        json_error('You have no print credits left. Please purchase additional credits.', 402);
    }

    $pdo->prepare(
        'UPDATE print_purchases SET credits_used = credits_used + 1, updated_at = NOW() WHERE id = ?'
    )->execute([$purchaseId]);

    $printNumber = (int) $row['credits_used'] + 1;
    $remainingAfter = $remaining - 1;
    $logId = new_id('plog');

    $pdo->prepare(
        'INSERT INTO print_logs
         (id, student_id, pdf_id, purchase_id, print_number, printer_name, remaining_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $logId,
        $auth['sid'],
        $row['pdf_id'],
        $purchaseId,
        $printNumber,
        $printerName !== '' ? $printerName : 'Browser Print',
        $remainingAfter,
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error($e->getMessage(), 500);
}

json_response([
    'ok' => true,
    'print' => [
        'id' => $logId,
        'printNumber' => $printNumber,
        'remaining' => $remainingAfter,
        'pdfTitle' => $row['pdf_title'],
        'printerName' => $printerName !== '' ? $printerName : 'Browser Print',
    ],
]);
