<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/college_helpers.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('College id required.');
}

$body = read_json_body();

$name = trim((string) ($body['name'] ?? ''));
$type = (string) ($body['type'] ?? 'private');
$city = trim((string) ($body['city'] ?? ''));
$location = trim((string) ($body['location'] ?? $city));
$principal = trim((string) ($body['principalName'] ?? $body['principal_name'] ?? 'To be updated'));
$about = trim((string) ($body['about'] ?? ''));
$feesStructure = trim((string) ($body['feesStructure'] ?? $body['fees_structure'] ?? 'Fees details coming soon'));
$admissionStatus = (string) ($body['admissionStatus'] ?? $body['admission_status'] ?? 'open');
$approvalStatus = (string) ($body['approvalStatus'] ?? $body['approval_status'] ?? 'approved');

$allowedTypes = ['government', 'semi-government', 'private'];
if (!in_array($type, $allowedTypes, true)) {
    $type = 'private';
}
if (!in_array($admissionStatus, ['open', 'closed'], true)) {
    $admissionStatus = 'open';
}
if (!in_array($approvalStatus, ['approved', 'pending', 'rejected'], true)) {
    $approvalStatus = 'approved';
}

if (strlen($name) < 2 || strlen($city) < 2) {
    json_error('College name and city are required.');
}

$pdo = db();

$exists = $pdo->prepare('SELECT id FROM colleges WHERE id = ? LIMIT 1');
$exists->execute([$id]);
if (!$exists->fetch()) {
    json_error('College not found.', 404);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'UPDATE colleges SET
            name = ?, type = ?, city = ?, location = ?, principal_name = ?,
            fees_structure = ?, about = ?, admission_status = ?, approval_status = ?
         WHERE id = ?'
    );
    $stmt->execute([
        $name,
        $type,
        $city,
        $location,
        $principal !== '' ? $principal : 'To be updated',
        $feesStructure !== '' ? $feesStructure : 'Fees details coming soon',
        $about,
        $admissionStatus,
        $approvalStatus,
        $id,
    ]);

    // Replace all relations (programs, custom programs, fees, branches, images)
    $pdo->prepare('DELETE FROM college_programs WHERE college_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM college_custom_programs WHERE college_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM college_fees WHERE college_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM college_branches WHERE college_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM college_images WHERE college_id = ?')->execute([$id]);

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
    'message' => 'College updated.',
    'college' => fetch_college_bundle($pdo, $row),
]);
