<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('College id required.');
}

$stmt = db()->prepare(
    "UPDATE colleges SET approval_status = 'rejected' WHERE id = ?"
);
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
    json_error('College not found.', 404);
}

json_response(['ok' => true, 'message' => 'College rejected.']);
