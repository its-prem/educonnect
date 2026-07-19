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
$pdo->beginTransaction();
try {
    $purchaseStmt = $pdo->prepare(
        'SELECT * FROM print_purchases
         WHERE id = ? AND student_id = ? AND status = \'paid\'
         LIMIT 1 FOR UPDATE'
    );
    $purchaseStmt->execute([$purchaseId, $auth['sid']]);
    $purchase = $purchaseStmt->fetch();
    if (!$purchase) {
        $pdo->rollBack();
        json_error('Purchase not found.', 404);
    }

    $logStmt = $pdo->prepare(
        'SELECT * FROM print_logs
         WHERE purchase_id = ? AND student_id = ?
         ORDER BY printed_at DESC, print_number DESC
         LIMIT 1 FOR UPDATE'
    );
    $logStmt->execute([$purchaseId, $auth['sid']]);
    $log = $logStmt->fetch();
    if (!$log) {
        $pdo->rollBack();
        json_error('No recent print to refund.', 404);
    }

    $printedAt = strtotime((string) $log['printed_at']);
    if ($printedAt === false || (time() - $printedAt) > 120) {
        $pdo->rollBack();
        json_error('Refund window expired (2 minutes). Contact admin if needed.', 400);
    }

    $used = (int) $purchase['credits_used'];
    if ($used < 1) {
        $pdo->rollBack();
        json_error('Nothing to refund.');
    }

    $pdo->prepare(
        'UPDATE print_purchases SET credits_used = credits_used - 1, updated_at = NOW() WHERE id = ?'
    )->execute([$purchaseId]);

    $pdo->prepare('DELETE FROM print_logs WHERE id = ?')->execute([$log['id']]);

    $pdo->commit();

    $purchaseStmt->execute([$purchaseId, $auth['sid']]);
    $updated = $purchaseStmt->fetch() ?: $purchase;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error($e->getMessage(), 500);
}

json_response([
    'ok' => true,
    'purchase' => print_map_purchase($updated),
    'remaining' => print_purchase_remaining($updated),
]);
