<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$body = read_json_body();
$email = normalize_email((string) ($body['email'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));

if ($email === '' || strlen($phone) < 10) {
    json_error('Enter college Gmail and phone number to log in.');
}

$stmt = db()->prepare(
    'SELECT id, college_name, contact_name, phone, email, branch, created_at
     FROM college_accounts WHERE email = ? AND phone = ? LIMIT 1'
);
$stmt->execute([$email, $phone]);
$row = $stmt->fetch();

if (!$row) {
    json_error('No campus account found for this Gmail + phone. Register first.', 404);
}

json_response([
    'ok' => true,
    'account' => [
        'id' => $row['id'],
        'collegeName' => $row['college_name'],
        'contactName' => $row['contact_name'],
        'phone' => $row['phone'],
        'email' => $row['email'],
        'branch' => $row['branch'],
        'createdAt' => $row['created_at'],
    ],
]);
