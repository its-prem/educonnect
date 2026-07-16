<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$rows = db()->query(
    'SELECT id, stream_id, name, slug FROM programs ORDER BY name'
)->fetchAll();

$programs = array_map(
    static fn(array $r): array => [
        'id' => $r['id'],
        'streamId' => $r['stream_id'],
        'name' => $r['name'],
        'slug' => $r['slug'],
    ],
    $rows
);

json_response(['ok' => true, 'programs' => $programs]);
