<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('PDF id required.');
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM print_pdfs WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$row = $stmt->fetch();
if (!$row) {
    json_error('PDF not found.', 404);
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    json_error('Upload a PDF file to replace.');
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

try {
    $path = print_store_encrypted_file($id, $bytes);
} catch (Throwable $e) {
    json_error($e->getMessage(), 500);
}

$pdo->prepare(
    'UPDATE print_pdfs SET file_path = ?, updated_at = NOW() WHERE id = ?'
)->execute([$path, $id]);

$stmt->execute([$id]);
$row = $stmt->fetch();

json_response([
    'ok' => true,
    'pdf' => print_map_pdf($row ?: [], true),
]);
