<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();
$email = normalize_email((string) ($body['email'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));

if ($email === '' || strlen($phone) < 10) {
    json_error('Enter your Gmail and phone number to log in.');
}

$stmt = db()->prepare(
    'SELECT id, name, phone, email, college_name, college_id, branch, created_at
     FROM students WHERE email = ? AND phone = ? LIMIT 1'
);
$stmt->execute([$email, $phone]);
$row = $stmt->fetch();

if (!$row) {
    json_error('No account found for this Gmail + phone. Register first.', 404);
}

json_response([
    'ok' => true,
    'student' => [
        'id' => $row['id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'email' => $row['email'],
        'collegeId' => $row['college_id'] ?: null,
        'collegeName' => $row['college_name'],
        'branch' => $row['branch'],
        'createdAt' => $row['created_at'],
    ],
]);
