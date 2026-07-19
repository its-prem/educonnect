<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

require_admin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $stmt = db()->query(
        'SELECT id, title, price_per_credit, file_path, enabled, created_at, updated_at
         FROM print_pdfs ORDER BY created_at DESC'
    );
    $rows = $stmt->fetchAll();
    json_response([
        'ok' => true,
        'pdfs' => array_map(static fn (array $r) => print_map_pdf($r, true), $rows),
    ]);
}

if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

$title = trim((string) ($_POST['title'] ?? ''));
$price = (float) ($_POST['pricePerCredit'] ?? $_POST['price_per_credit'] ?? 0);

if (strlen($title) < 2) {
    json_error('Enter a PDF title.');
}
if ($price < 0) {
    json_error('Price cannot be negative.');
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    json_error('Upload a PDF file.');
}

$file = $_FILES['file'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_error('PDF upload failed.');
}

$tmp = (string) ($file['tmp_name'] ?? '');
$name = strtolower((string) ($file['name'] ?? ''));
$size = (int) ($file['size'] ?? 0);
if ($tmp === '' || !is_uploaded_file($tmp)) {
    json_error('Invalid upload.');
}
if ($size < 1 || $size > 25 * 1024 * 1024) {
    json_error('PDF must be under 25 MB.');
}
if (!str_ends_with($name, '.pdf')) {
    json_error('Only PDF files are allowed.');
}

$bytes = file_get_contents($tmp);
if ($bytes === false || !str_starts_with($bytes, '%PDF')) {
    json_error('File does not look like a valid PDF.');
}

$id = new_id('ppdf');
try {
    $path = print_store_encrypted_file($id, $bytes);
} catch (Throwable $e) {
    json_error($e->getMessage(), 500);
}

db()->prepare(
    'INSERT INTO print_pdfs (id, title, price_per_credit, file_path, enabled)
     VALUES (?, ?, ?, ?, 1)'
)->execute([$id, $title, $price, $path]);

json_response([
    'ok' => true,
    'pdf' => print_map_pdf([
        'id' => $id,
        'title' => $title,
        'price_per_credit' => $price,
        'file_path' => $path,
        'enabled' => 1,
        'created_at' => date('c'),
        'updated_at' => date('c'),
    ], true),
], 201);
