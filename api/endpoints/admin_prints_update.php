<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('PDF id required.');
}

$body = read_json_body();
$title = array_key_exists('title', $body) ? trim((string) $body['title']) : null;
$price = array_key_exists('pricePerCredit', $body)
    ? (float) $body['pricePerCredit']
    : (array_key_exists('price_per_credit', $body) ? (float) $body['price_per_credit'] : null);
$enabled = array_key_exists('enabled', $body) ? (bool) $body['enabled'] : null;

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM print_pdfs WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$row = $stmt->fetch();
if (!$row) {
    json_error('PDF not found.', 404);
}

$newTitle = $title !== null && strlen($title) >= 2 ? $title : $row['title'];
$newPrice = $price !== null && $price >= 0 ? $price : (float) $row['price_per_credit'];
$newEnabled = $enabled !== null ? ($enabled ? 1 : 0) : (int) $row['enabled'];

$pdo->prepare(
    'UPDATE print_pdfs SET title = ?, price_per_credit = ?, enabled = ?, updated_at = NOW() WHERE id = ?'
)->execute([$newTitle, $newPrice, $newEnabled, $id]);

$stmt->execute([$id]);
$row = $stmt->fetch();

json_response([
    'ok' => true,
    'pdf' => print_map_pdf($row ?: [], true),
]);
