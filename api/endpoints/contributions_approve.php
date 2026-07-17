<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('Contribution id required.');
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM college_contributions WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$contribution = $stmt->fetch();
if (!$contribution) {
    json_error('Contribution not found.', 404);
}

$pdo->beginTransaction();
try {
    apply_contribution($pdo, $contribution);
    $update = $pdo->prepare(
        "UPDATE college_contributions SET status = 'approved', reviewed_at = NOW() WHERE id = ?"
    );
    $update->execute([$id]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

json_response(['ok' => true, 'message' => 'Contribution approved and merged into the college.']);
