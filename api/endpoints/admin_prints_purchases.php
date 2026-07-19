<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

require_admin();

$stmt = db()->query(
    'SELECT p.*, pdf.title AS pdf_title, s.name AS student_name, s.email AS student_email
     FROM print_purchases p
     JOIN print_pdfs pdf ON pdf.id = p.pdf_id
     JOIN students s ON s.id = p.student_id
     ORDER BY p.purchased_at DESC
     LIMIT 500'
);
$rows = $stmt->fetchAll();

json_response([
    'ok' => true,
    'purchases' => array_map(static function (array $r) {
        $mapped = print_map_purchase($r, ['title' => $r['pdf_title']], ['name' => $r['student_name']]);
        $mapped['studentEmail'] = $r['student_email'];
        return $mapped;
    }, $rows),
]);
