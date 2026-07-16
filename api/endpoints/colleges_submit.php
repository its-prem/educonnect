<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

$body = read_json_body();

$name = trim((string) ($body['name'] ?? ''));
$type = (string) ($body['type'] ?? 'private');
$city = trim((string) ($body['city'] ?? ''));
$location = trim((string) ($body['location'] ?? $city));
$principal = trim((string) ($body['principalName'] ?? $body['principal_name'] ?? 'To be updated'));
$about = trim((string) ($body['about'] ?? ''));
$feesStructure = trim((string) ($body['feesStructure'] ?? $body['fees_structure'] ?? 'Fees details coming soon'));
$submittedBy = (string) ($body['submittedBy'] ?? $body['submitted_by'] ?? 'student');
$submittedById = trim((string) ($body['submittedById'] ?? $body['studentId'] ?? ''));

$allowedTypes = ['government', 'semi-government', 'private'];
if (!in_array($type, $allowedTypes, true)) {
    $type = 'private';
}
$allowedSources = ['admin', 'student', 'college'];
if (!in_array($submittedBy, $allowedSources, true)) {
    $submittedBy = 'student';
}

if (strlen($name) < 2 || strlen($city) < 2) {
    json_error('College name and city are required.');
}

$programIds = $body['programIds'] ?? [];
$custom = $body['customPrograms'] ?? [];
if ((!is_array($programIds) || $programIds === []) && (!is_array($custom) || $custom === [])) {
    json_error('Select or add at least one program.');
}

$pdo = db();
$id = new_id('col');
$slug = slugify($name) . '-' . substr($id, -5);
$shareUrl = trim((string) ($body['shareUrl'] ?? '')) ?: ('https://educonnect.demo/colleges/' . $slug);

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO colleges
         (id, slug, name, type, city, location, principal_name, fees_structure, about, share_url,
          admission_status, approval_status, submitted_by, submitted_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        $slug,
        $name,
        $type,
        $city,
        $location,
        $principal !== '' ? $principal : 'To be updated',
        $feesStructure !== '' ? $feesStructure : 'Fees details coming soon',
        $about,
        $shareUrl,
        'open',
        'pending', // always pending for public submit
        $submittedBy,
        $submittedById !== '' ? $submittedById : null,
    ]);

    insert_college_relations($pdo, $id, $body);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

$stmt = $pdo->prepare('SELECT * FROM colleges WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch();

json_response([
    'ok' => true,
    'message' => 'Request sent to Super Admin. Visible after approval.',
    'college' => fetch_college_bundle($pdo, $row),
], 201);
