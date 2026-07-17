<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('Student id required.');
}

$stmt = db()->prepare('DELETE FROM students WHERE id = ?');
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
    json_error('Student not found.', 404);
}

json_response(['ok' => true, 'message' => 'Student profile deleted.']);
