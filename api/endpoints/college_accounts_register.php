<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

json_error('College registration is temporarily disabled. Please use Student Login.', 503);

$body = read_json_body();
$collegeName = trim((string) ($body['collegeName'] ?? $body['college_name'] ?? ''));
$contactName = trim((string) ($body['contactName'] ?? $body['contact_name'] ?? ''));
$branch = trim((string) ($body['branch'] ?? ''));
$phone = normalize_phone((string) ($body['phone'] ?? ''));
$email = normalize_email((string) ($body['email'] ?? ''));

if (strlen($collegeName) < 2) {
    json_error('Enter the college name.');
}
if (strlen($contactName) < 2) {
    json_error('Enter a contact person name.');
}
if (strlen($branch) < 2) {
    json_error('Enter at least one branch (e.g. CSE).');
}
if (strlen($phone) < 10) {
    json_error('Enter a valid 10-digit phone number.');
}
if (!str_contains($email, '@') || !str_contains($email, '.')) {
    json_error('Enter a valid Gmail / email address.');
}

$pdo = db();
$check = $pdo->prepare('SELECT id FROM college_accounts WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    json_error('This email is already registered. Please log in.');
}

$id = new_id('camp');
$stmt = $pdo->prepare(
    'INSERT INTO college_accounts (id, college_name, contact_name, phone, email, branch)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$id, $collegeName, $contactName, $phone, $email, $branch]);

json_response([
    'ok' => true,
    'account' => [
        'id' => $id,
        'collegeName' => $collegeName,
        'contactName' => $contactName,
        'phone' => $phone,
        'email' => $email,
        'branch' => $branch,
        'createdAt' => date('c'),
    ],
], 201);
