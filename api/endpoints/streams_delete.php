<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('Stream id required.');
}

// FK ON DELETE CASCADE removes this stream's programs (and their college links)
$stmt = db()->prepare('DELETE FROM streams WHERE id = ?');
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
    json_error('Stream not found.', 404);
}

json_response(['ok' => true, 'message' => 'Stream removed.']);
