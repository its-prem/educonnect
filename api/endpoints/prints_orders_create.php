<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';
require_once __DIR__ . '/cashfree_helpers.php';

$auth = require_student();
$body = read_json_body();
$pdfId = trim((string) ($body['pdfId'] ?? $body['pdf_id'] ?? ''));
$credits = (int) ($body['credits'] ?? 0);

if ($pdfId === '') {
    json_error('Select a PDF.');
}
if ($credits < 1 || $credits > 100) {
    json_error('Credits must be between 1 and 100.');
}

$pdo = db();
$pdfStmt = $pdo->prepare('SELECT * FROM print_pdfs WHERE id = ? AND enabled = 1 LIMIT 1');
$pdfStmt->execute([$pdfId]);
$pdf = $pdfStmt->fetch();
if (!$pdf) {
    json_error('PDF not found or disabled.', 404);
}

$stuStmt = $pdo->prepare('SELECT id, name, phone, email FROM students WHERE id = ? LIMIT 1');
$stuStmt->execute([$auth['sid']]);
$student = $stuStmt->fetch();
if (!$student) {
    json_error('Student not found.', 404);
}

$amount = round($credits * (float) $pdf['price_per_credit'], 2);
if ($amount < 1 && !cashfree_is_mock()) {
    json_error('Order amount must be at least ₹1.');
}

$orderId = new_id('pord');
$cashfreeOrderId = 'cf_' . str_replace('-', '', $orderId);
$frontend = rtrim((string) (app_config()['frontend_url'] ?? 'http://localhost:5173'), '/');
$apiPublic = rtrim((string) (app_config()['api_public_url'] ?? ''), '/');
$returnUrl = $frontend . '/prints/payment/return?order_id={order_id}';
$notifyUrl = $apiPublic !== '' ? $apiPublic . '/prints/webhook/cashfree' : '';

try {
    $cf = cashfree_create_order([
        'order_id' => $cashfreeOrderId,
        'amount' => max($amount, cashfree_is_mock() ? 0 : 1),
        'customer_id' => $student['id'],
        'customer_phone' => $student['phone'],
        'customer_email' => $student['email'],
        'customer_name' => $student['name'],
        'return_url' => $returnUrl,
        'notify_url' => $notifyUrl,
    ]);
} catch (Throwable $e) {
    json_error($e->getMessage(), 502);
}

$pdo->prepare(
    'INSERT INTO print_orders
     (id, student_id, pdf_id, credits, amount, cashfree_order_id, payment_session_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, \'pending\')'
)->execute([
    $orderId,
    $student['id'],
    $pdfId,
    $credits,
    $amount,
    $cf['order_id'],
    $cf['payment_session_id'],
]);

$mock = !empty($cf['mock']);
if ($mock) {
    try {
        print_fulfill_order($orderId);
    } catch (Throwable $e) {
        json_error('Mock payment fulfill failed: ' . $e->getMessage(), 500);
    }
}

json_response([
    'ok' => true,
    'order' => [
        'id' => $orderId,
        'cashfreeOrderId' => $cf['order_id'],
        'paymentSessionId' => $cf['payment_session_id'],
        'amount' => $amount,
        'credits' => $credits,
        'pdfId' => $pdfId,
        'pdfTitle' => $pdf['title'],
        'mock' => $mock,
        'status' => $mock ? 'paid' : 'pending',
    ],
], 201);
