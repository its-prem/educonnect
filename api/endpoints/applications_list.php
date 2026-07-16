<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$email = normalize_email((string) ($_GET['email'] ?? ''));
$pdo = db();

if ($email !== '') {
    $stmt = $pdo->prepare(
        'SELECT * FROM applications WHERE email = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$email]);
    $rows = $stmt->fetchAll();
} else {
    // Admin-only full list
    require_admin();
    $rows = $pdo->query('SELECT * FROM applications ORDER BY created_at DESC')->fetchAll();
}

$apps = array_map(
    static fn(array $r): array => [
        'id' => $r['id'],
        'collegeId' => $r['college_id'],
        'collegeSlug' => $r['college_slug'],
        'collegeName' => $r['college_name'],
        'studentName' => $r['student_name'],
        'email' => $r['email'],
        'phone' => $r['phone'],
        'branch' => $r['branch'],
        'message' => $r['message'],
        'status' => $r['status'],
        'createdAt' => $r['created_at'],
    ],
    $rows
);

json_response(['ok' => true, 'applications' => $apps]);
