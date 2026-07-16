<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();

$collegeId = trim((string) ($body['collegeId'] ?? $body['college_id'] ?? ''));
$collegeSlug = trim((string) ($body['collegeSlug'] ?? $body['college_slug'] ?? ''));
$collegeName = trim((string) ($body['collegeName'] ?? $body['college_name'] ?? ''));
$studentName = trim((string) ($body['studentName'] ?? $body['student_name'] ?? ''));
$email = normalize_email((string) ($body['email'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));
$branch = trim((string) ($body['branch'] ?? ''));
$message = trim((string) ($body['message'] ?? ''));

if ($collegeId === '' || $studentName === '' || $email === '' || strlen($phone) < 10) {
    json_error('College, student name, email and phone are required.');
}

$pdo = db();
$check = $pdo->prepare(
    "SELECT id, slug, name, approval_status, admission_status FROM colleges WHERE id = ? LIMIT 1"
);
$check->execute([$collegeId]);
$college = $check->fetch();

if (!$college || $college['approval_status'] !== 'approved') {
    json_error('College not available for admission.', 404);
}
if ($college['admission_status'] !== 'open') {
    json_error('Admissions are closed for this college.');
}

$id = new_id('app');
$stmt = $pdo->prepare(
    'INSERT INTO applications
     (id, college_id, college_slug, college_name, student_name, email, phone, branch, message, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $id,
    $collegeId,
    $collegeSlug !== '' ? $collegeSlug : $college['slug'],
    $collegeName !== '' ? $collegeName : $college['name'],
    $studentName,
    $email,
    $phone,
    $branch !== '' ? $branch : 'General',
    $message,
    'submitted',
]);

json_response([
    'ok' => true,
    'application' => [
        'id' => $id,
        'collegeId' => $collegeId,
        'collegeSlug' => $collegeSlug !== '' ? $collegeSlug : $college['slug'],
        'collegeName' => $collegeName !== '' ? $collegeName : $college['name'],
        'studentName' => $studentName,
        'email' => $email,
        'phone' => $phone,
        'branch' => $branch !== '' ? $branch : 'General',
        'message' => $message,
        'status' => 'submitted',
        'createdAt' => date('c'),
    ],
], 201);
