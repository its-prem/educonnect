<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

$auth = require_student();

$stmt = db()->prepare(
    'SELECT l.*, pdf.title AS pdf_title, s.name AS student_name
     FROM print_logs l
     JOIN print_pdfs pdf ON pdf.id = l.pdf_id
     JOIN students s ON s.id = l.student_id
     WHERE l.student_id = ?
     ORDER BY l.printed_at DESC
     LIMIT 200'
);
$stmt->execute([$auth['sid']]);
$rows = $stmt->fetchAll();

json_response([
    'ok' => true,
    'logs' => array_map(static function (array $r) {
        return [
            'id' => $r['id'],
            'studentName' => $r['student_name'],
            'pdfName' => $r['pdf_title'],
            'printNumber' => (int) $r['print_number'],
            'printedAt' => $r['printed_at'],
            'printerName' => $r['printer_name'],
            'remainingCredits' => (int) $r['remaining_after'],
        ];
    }, $rows),
]);
