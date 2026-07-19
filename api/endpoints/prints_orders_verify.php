<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/print_helpers.php';
require_once __DIR__ . '/cashfree_helpers.php';

$auth = require_student();
$body = read_json_body();
$orderId = trim((string) ($body['orderId'] ?? $body['order_id'] ?? $_GET['order_id'] ?? ''));

if ($orderId === '') {
    json_error('order_id required.');
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT * FROM print_orders WHERE (id = ? OR cashfree_order_id = ?) AND student_id = ? LIMIT 1'
);
$stmt->execute([$orderId, $orderId, $auth['sid']]);
$order = $stmt->fetch();
if (!$order) {
    json_error('Order not found.', 404);
}

if ($order['status'] !== 'paid') {
    try {
        $cf = cashfree_fetch_order($order['cashfree_order_id']);
        $status = strtoupper($cf['order_status']);
        if (in_array($status, ['PAID', 'ACTIVE'], true) || cashfree_is_mock()) {
            // ACTIVE can mean created; only fulfill on PAID or mock
            if ($status === 'PAID' || cashfree_is_mock()) {
                print_fulfill_order($order['id']);
                $order['status'] = 'paid';
            }
        } elseif (in_array($status, ['EXPIRED', 'TERMINATED', 'FAILED'], true)) {
            $pdo->prepare("UPDATE print_orders SET status = 'failed' WHERE id = ?")->execute([$order['id']]);
            $order['status'] = 'failed';
        }
    } catch (Throwable $e) {
        json_error($e->getMessage(), 502);
    }
}

json_response([
    'ok' => true,
    'order' => [
        'id' => $order['id'],
        'cashfreeOrderId' => $order['cashfree_order_id'],
        'status' => $order['status'],
        'credits' => (int) $order['credits'],
        'amount' => (float) $order['amount'],
        'pdfId' => $order['pdf_id'],
    ],
]);
