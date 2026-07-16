<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$rows = db()->query('SELECT id, name, slug, hint FROM streams ORDER BY name')->fetchAll();
$streams = array_map(
    static fn(array $r): array => [
        'id' => $r['id'],
        'name' => $r['name'],
        'slug' => $r['slug'],
        'hint' => $r['hint'],
    ],
    $rows
);

json_response(['ok' => true, 'streams' => $streams]);
