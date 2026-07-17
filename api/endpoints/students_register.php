<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();
$name = trim((string) ($body['name'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));
$email = normalize_email((string) ($body['email'] ?? ''));
$collegeName = trim((string) ($body['collegeName'] ?? $body['college_name'] ?? ''));
$collegeId = trim((string) ($body['collegeId'] ?? $body['college_id'] ?? ''));
$branch = trim((string) ($body['branch'] ?? ''));

if (strlen($name) < 2) {
    json_error('Please enter your full name.');
}
if (strlen($collegeName) < 2) {
    json_error('Please select or enter your college name.');
}
if (strlen($branch) < 2) {
    json_error('Please enter your branch.');
}
if (strlen($phone) < 10) {
    json_error('Enter a valid 10-digit phone number.');
}
if (!str_contains($email, '@') || !str_contains($email, '.')) {
    json_error('Enter a valid Gmail / email address.');
}

$pdo = db();

// If linked to a listed college, verify it exists and is approved
if ($collegeId !== '') {
    $col = $pdo->prepare(
        "SELECT id, name FROM colleges WHERE id = ? AND approval_status = 'approved' LIMIT 1"
    );
    $col->execute([$collegeId]);
    $college = $col->fetch();
    if (!$college) {
        json_error('Selected college was not found or is not approved yet.');
    }
    $collegeName = $college['name'];
} else {
    $collegeId = null;
}

$check = $pdo->prepare('SELECT id FROM students WHERE email = ? OR phone = ? LIMIT 1');
$check->execute([$email, $phone]);
if ($check->fetch()) {
    json_error('This email or phone is already registered. Please log in.');
}

$id = new_id('stu');
$stmt = $pdo->prepare(
    'INSERT INTO students (id, name, phone, email, college_name, college_id, branch)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$id, $name, $phone, $email, $collegeName, $collegeId, $branch]);

json_response([
    'ok' => true,
    'student' => [
        'id' => $id,
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'collegeId' => $collegeId,
        'collegeName' => $collegeName,
        'branch' => $branch,
        'createdAt' => date('c'),
    ],
], 201);
