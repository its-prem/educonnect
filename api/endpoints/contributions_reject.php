<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('Contribution id required.');
}

$stmt = db()->prepare(
    "UPDATE college_contributions SET status = 'rejected', reviewed_at = NOW() WHERE id = ?"
);
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
    json_error('Contribution not found.', 404);
}

json_response(['ok' => true, 'message' => 'Contribution rejected.']);
