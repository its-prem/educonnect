<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

$auth = require_student();
$purchaseId = trim((string) ($_GET['id'] ?? ''));
if ($purchaseId === '') {
    json_error('Purchase id required.');
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT p.*, pdf.file_path, pdf.title AS pdf_title, pdf.enabled
     FROM print_purchases p
     JOIN print_pdfs pdf ON pdf.id = p.pdf_id
     WHERE p.id = ? AND p.student_id = ? AND p.status = \'paid\'
     LIMIT 1'
);
$stmt->execute([$purchaseId, $auth['sid']]);
$row = $stmt->fetch();
if (!$row) {
    json_error('Purchase not found.', 404);
}
if ((int) $row['enabled'] !== 1) {
    json_error('This PDF is currently disabled.', 403);
}

try {
    $bytes = print_load_decrypted_file($row['file_path']);
} catch (Throwable $e) {
    json_error($e->getMessage(), 500);
}

// Stream PDF bytes — no public filesystem URL
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="document.pdf"');
header('Cache-Control: no-store, no-cache, must-revalidate, private');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Content-Length: ' . strlen($bytes));
echo $bytes;
exit;
