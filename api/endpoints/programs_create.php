<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$body = read_json_body();
$streamId = trim((string) ($body['streamId'] ?? $body['stream_id'] ?? ''));
$name = trim((string) ($body['name'] ?? ''));

if ($streamId === '') {
    json_error('Select a stream.');
}
if (strlen($name) < 1) {
    json_error('Enter a program name.');
}

$pdo = db();

$streamCheck = $pdo->prepare('SELECT id FROM streams WHERE id = ? LIMIT 1');
$streamCheck->execute([$streamId]);
if (!$streamCheck->fetch()) {
    json_error('Stream not found.', 404);
}

$id = new_id('prog');
$base = slugify($name);
$slug = $base;
$check = $pdo->prepare('SELECT id FROM programs WHERE slug = ? LIMIT 1');
$check->execute([$slug]);
if ($check->fetch()) {
    $slug = $base . '-' . substr($id, -4);
}

$stmt = $pdo->prepare('INSERT INTO programs (id, stream_id, name, slug) VALUES (?, ?, ?, ?)');
$stmt->execute([$id, $streamId, $name, $slug]);

json_response([
    'ok' => true,
    'program' => [
        'id' => $id,
        'streamId' => $streamId,
        'name' => $name,
        'slug' => $slug,
    ],
], 201);
