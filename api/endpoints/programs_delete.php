<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('Program id required.');
}

// FK ON DELETE CASCADE removes college_programs links for this program
$stmt = db()->prepare('DELETE FROM programs WHERE id = ?');
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
    json_error('Program not found.', 404);
}

json_response(['ok' => true, 'message' => 'Program removed.']);
