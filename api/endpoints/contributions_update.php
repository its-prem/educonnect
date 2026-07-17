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
$row = $stmt->fetch();
if (!$row) {
    json_error('Contribution not found.', 404);
}

if ($row['status'] !== 'pending') {
    json_error('Only pending requests can be updated.');
}

$body = read_json_body();

$allowedEditKeys = ['about', 'location', 'principalName', 'type', 'admissionStatus', 'feesStructure', 'branches'];
$rawEdits = $body['edits'] ?? null;
$edits = json_decode((string) ($row['edits'] ?? '{}'), true);
if (!is_array($edits)) {
    $edits = [];
}

if (is_array($rawEdits)) {
    $edits = [];
    foreach ($allowedEditKeys as $key) {
        if (!array_key_exists($key, $rawEdits)) {
            continue;
        }
        if ($key === 'branches') {
            if (is_array($rawEdits['branches'])) {
                $branches = array_values(array_filter(array_map(
                    static fn($b): string => trim((string) $b),
                    $rawEdits['branches']
                ), static fn(string $b): bool => $b !== ''));
                if ($branches !== []) {
                    $edits['branches'] = $branches;
                }
            }
            continue;
        }
        $value = trim((string) $rawEdits[$key]);
        if ($value !== '') {
            $edits[$key] = $value;
        }
    }
}

$images = json_decode((string) ($row['images'] ?? '[]'), true);
if (!is_array($images)) {
    $images = [];
}
if (array_key_exists('images', $body) && is_array($body['images'])) {
    $images = [];
    foreach ($body['images'] as $url) {
        $url = trim((string) $url);
        if ($url !== '') {
            $images[] = $url;
        }
    }
}

$note = array_key_exists('note', $body)
    ? trim((string) $body['note'])
    : (string) ($row['note'] ?? '');

$update = $pdo->prepare(
    'UPDATE college_contributions SET images = ?, edits = ?, note = ? WHERE id = ?'
);
$update->execute([
    json_encode($images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    json_encode($edits, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    $note,
    $id,
]);

$fresh = $pdo->prepare('SELECT * FROM college_contributions WHERE id = ? LIMIT 1');
$fresh->execute([$id]);
$updated = $fresh->fetch();

json_response([
    'ok' => true,
    'message' => 'Contribution request updated.',
    'contribution' => contribution_bundle($updated),
]);
