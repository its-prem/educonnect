<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();
$name = trim((string) ($body['name'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));
$email = normalize_email((string) ($body['email'] ?? ''));
$collegeName = trim((string) ($body['collegeName'] ?? $body['college_name'] ?? ''));
$branch = trim((string) ($body['branch'] ?? ''));

if (strlen($name) < 2) {
    json_error('Please enter your full name.');
}
if (strlen($collegeName) < 2) {
    json_error('Please enter your college name.');
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

$check = $pdo->prepare('SELECT id FROM students WHERE email = ? OR phone = ? LIMIT 1');
$check->execute([$email, $phone]);
if ($check->fetch()) {
    json_error('This email or phone is already registered. Please log in.');
}

$id = new_id('stu');
$stmt = $pdo->prepare(
    'INSERT INTO students (id, name, phone, email, college_name, branch)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$id, $name, $phone, $email, $collegeName, $branch]);

json_response([
    'ok' => true,
    'student' => [
        'id' => $id,
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'collegeName' => $collegeName,
        'branch' => $branch,
        'createdAt' => date('c'),
    ],
], 201);
