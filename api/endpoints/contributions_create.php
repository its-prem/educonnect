<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$collegeId = trim((string) ($_GET['id'] ?? ''));
if ($collegeId === '') {
    json_error('College id required.');
}

$body = read_json_body();

$pdo = db();
$stmt = $pdo->prepare('SELECT id, slug, name FROM colleges WHERE id = ? LIMIT 1');
$stmt->execute([$collegeId]);
$college = $stmt->fetch();
if (!$college) {
    json_error('College not found.', 404);
}

$studentId = trim((string) ($body['studentId'] ?? ''));
if ($studentId !== '') {
    $stu = $pdo->prepare('SELECT college_id, college_name FROM students WHERE id = ? LIMIT 1');
    $stu->execute([$studentId]);
    $studentRow = $stu->fetch();
    if (!$studentRow) {
        json_error('Student account not found.', 404);
    }
    $linked = $studentRow['college_id'] ?? null;
    $studentCollegeName = trim((string) ($studentRow['college_name'] ?? ''));
    $collegeNameNorm = strtolower(preg_replace('/\s+/', ' ', $college['name']) ?? $college['name']);
    $studentNameNorm = strtolower(preg_replace('/\s+/', ' ', $studentCollegeName) ?? $studentCollegeName);

    if ($linked !== null && $linked !== '') {
        if ($linked !== $collegeId) {
            json_error('You can only contribute photos and edits for your own registered college.');
        }
    } elseif ($studentNameNorm === '' || $studentNameNorm !== $collegeNameNorm) {
        json_error('Your account is registered under Other — you can list a new college, or edit only if the name matches.');
    }
}

$allowedEditKeys = ['about', 'location', 'principalName', 'type', 'admissionStatus', 'feesStructure', 'branches'];
$rawEdits = $body['edits'] ?? [];
$edits = [];
if (is_array($rawEdits)) {
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

$images = [];
if (is_array($body['images'] ?? null)) {
    foreach ($body['images'] as $url) {
        $url = trim((string) $url);
        if ($url !== '') {
            $images[] = $url;
        }
    }
}

$note = trim((string) ($body['note'] ?? ''));

if ($images === [] && $edits === []) {
    json_error('Add at least one photo or one edit to send a request.');
}

$id = new_id('contrib');
$stmt = $pdo->prepare(
    'INSERT INTO college_contributions
     (id, college_id, college_slug, college_name, student_id, student_name, student_email, student_phone, images, edits, note, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $id,
    $college['id'],
    $college['slug'],
    $college['name'],
    $studentId !== '' ? $studentId : null,
    trim((string) ($body['studentName'] ?? '')),
    normalize_email((string) ($body['studentEmail'] ?? '')),
    normalize_phone((string) ($body['studentPhone'] ?? '')),
    json_encode($images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    json_encode($edits, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    $note,
    'pending',
]);

json_response([
    'ok' => true,
    'message' => 'Sent to Super Admin. It will show after approval.',
    'contributionId' => $id,
], 201);
