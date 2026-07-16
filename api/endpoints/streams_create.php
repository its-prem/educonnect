<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$body = read_json_body();
$name = trim((string) ($body['name'] ?? ''));
$hint = trim((string) ($body['hint'] ?? ''));

if (strlen($name) < 2) {
    json_error('Enter a stream name.');
}

$pdo = db();
$id = new_id('stream');

$base = slugify($name);
$slug = $base;
$check = $pdo->prepare('SELECT id FROM streams WHERE slug = ? LIMIT 1');
$check->execute([$slug]);
if ($check->fetch()) {
    $slug = $base . '-' . substr($id, -4);
}

$stmt = $pdo->prepare('INSERT INTO streams (id, name, slug, hint) VALUES (?, ?, ?, ?)');
$stmt->execute([$id, $name, $slug, $hint]);

json_response([
    'ok' => true,
    'stream' => [
        'id' => $id,
        'name' => $name,
        'slug' => $slug,
        'hint' => $hint,
    ],
], 201);
