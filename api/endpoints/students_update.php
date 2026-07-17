<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('Student id required.');
}

$body = read_json_body();
$name = trim((string) ($body['name'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));
$email = normalize_email((string) ($body['email'] ?? ''));
$collegeName = trim((string) ($body['collegeName'] ?? $body['college_name'] ?? ''));
$collegeId = trim((string) ($body['collegeId'] ?? $body['college_id'] ?? ''));
$branch = trim((string) ($body['branch'] ?? ''));

if (strlen($name) < 2) {
    json_error('Please enter the student full name.');
}
if (strlen($collegeName) < 2) {
    json_error('Please enter the college name.');
}
if (strlen($branch) < 2) {
    json_error('Please enter the branch.');
}
if (strlen($phone) < 10) {
    json_error('Enter a valid 10-digit phone number.');
}
if (!str_contains($email, '@') || !str_contains($email, '.')) {
    json_error('Enter a valid email address.');
}

$pdo = db();

$exists = $pdo->prepare('SELECT id FROM students WHERE id = ? LIMIT 1');
$exists->execute([$id]);
if (!$exists->fetch()) {
    json_error('Student not found.', 404);
}

// Unique email / phone excluding this student
$dup = $pdo->prepare(
    'SELECT id FROM students WHERE (email = ? OR phone = ?) AND id <> ? LIMIT 1'
);
$dup->execute([$email, $phone, $id]);
if ($dup->fetch()) {
    json_error('Another student already uses this email or phone.');
}

if ($collegeId !== '') {
    $col = $pdo->prepare(
        "SELECT id, name FROM colleges WHERE id = ? AND approval_status = 'approved' LIMIT 1"
    );
    $col->execute([$collegeId]);
    $college = $col->fetch();
    if (!$college) {
        json_error('Selected college was not found or is not approved.');
    }
    $collegeName = $college['name'];
} else {
    $collegeId = null;
}

$stmt = $pdo->prepare(
    'UPDATE students SET name = ?, phone = ?, email = ?, college_name = ?, college_id = ?, branch = ?
     WHERE id = ?'
);
$stmt->execute([$name, $phone, $email, $collegeName, $collegeId, $branch, $id]);

$row = $pdo->prepare(
    'SELECT id, name, phone, email, college_name, college_id, branch, created_at FROM students WHERE id = ?'
);
$row->execute([$id]);
$student = $row->fetch();

json_response([
    'ok' => true,
    'message' => 'Student profile updated.',
    'student' => [
        'id' => $student['id'],
        'name' => $student['name'],
        'phone' => $student['phone'],
        'email' => $student['email'],
        'collegeId' => $student['college_id'] ?: null,
        'collegeName' => $student['college_name'],
        'branch' => $student['branch'],
        'createdAt' => $student['created_at'],
    ],
]);
