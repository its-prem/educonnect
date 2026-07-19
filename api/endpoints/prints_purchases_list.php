<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

$auth = require_student();

$stmt = db()->prepare(
    'SELECT p.*, pdf.title AS pdf_title
     FROM print_purchases p
     JOIN print_pdfs pdf ON pdf.id = p.pdf_id
     WHERE p.student_id = ? AND p.status = \'paid\'
     ORDER BY p.purchased_at DESC'
);
$stmt->execute([$auth['sid']]);
$rows = $stmt->fetchAll();

json_response([
    'ok' => true,
    'purchases' => array_map(static function (array $r) {
        return print_map_purchase($r, ['title' => $r['pdf_title']]);
    }, $rows),
]);
