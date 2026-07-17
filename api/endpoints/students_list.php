<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_admin();

$rows = db()->query(
    'SELECT id, name, phone, email, college_name, college_id, branch, created_at
     FROM students ORDER BY created_at DESC'
)->fetchAll();

$students = array_map(
    static fn(array $r): array => [
        'id' => $r['id'],
        'name' => $r['name'],
        'phone' => $r['phone'],
        'email' => $r['email'],
        'collegeId' => $r['college_id'] ?: null,
        'collegeName' => $r['college_name'],
        'branch' => $r['branch'],
        'createdAt' => $r['created_at'],
    ],
    $rows
);

json_response(['ok' => true, 'students' => $students, 'count' => count($students)]);
