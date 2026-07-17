<?php
/**
 * College row assembly helpers
 */

declare(strict_types=1);

function fetch_college_bundle(PDO $pdo, array $college): array
{
    $id = $college['id'];

    $prog = $pdo->prepare('SELECT program_id FROM college_programs WHERE college_id = ?');
    $prog->execute([$id]);
    $programIds = array_column($prog->fetchAll(), 'program_id');

    $custom = $pdo->prepare('SELECT name FROM college_custom_programs WHERE college_id = ? ORDER BY id');
    $custom->execute([$id]);
    $customPrograms = array_column($custom->fetchAll(), 'name');

    $fees = $pdo->prepare(
        'SELECT program_label, amount FROM college_fees WHERE college_id = ? ORDER BY id'
    );
    $fees->execute([$id]);
    $feeRows = array_map(
        static fn(array $r): array => [
            'programLabel' => $r['program_label'],
            'amount' => $r['amount'],
        ],
        $fees->fetchAll()
    );

    $branches = $pdo->prepare('SELECT name FROM college_branches WHERE college_id = ? ORDER BY id');
    $branches->execute([$id]);
    $branchNames = array_column($branches->fetchAll(), 'name');

    $images = $pdo->prepare(
        'SELECT image_url FROM college_images WHERE college_id = ? ORDER BY sort_order, id'
    );
    $images->execute([$id]);
    $imageUrls = array_column($images->fetchAll(), 'image_url');

    $feesStructure = $college['fees_structure'];
    if ($feeRows !== []) {
        $feesStructure = implode("\n", array_map(
            static fn(array $r): string => $r['programLabel'] . ': ' . $r['amount'],
            $feeRows
        ));
    }

    return [
        'id' => $college['id'],
        'slug' => $college['slug'],
        'name' => $college['name'],
        'type' => $college['type'],
        'programIds' => $programIds,
        'customPrograms' => $customPrograms,
        'city' => $college['city'],
        'location' => $college['location'],
        'principalName' => $college['principal_name'],
        'feesStructure' => $feesStructure,
        'feeRows' => $feeRows,
        'courses' => $customPrograms,
        'branches' => $branchNames,
        'images' => $imageUrls,
        'admissionStatus' => $college['admission_status'],
        'approvalStatus' => $college['approval_status'],
        'submittedBy' => $college['submitted_by'],
        'submittedById' => $college['submitted_by_id'] ?? null,
        'about' => $college['about'],
        'shareUrl' => $college['share_url'],
    ];
}

function contribution_bundle(array $row): array
{
    $images = json_decode((string) ($row['images'] ?? '[]'), true);
    $edits = json_decode((string) ($row['edits'] ?? '{}'), true);

    return [
        'id' => $row['id'],
        'collegeId' => $row['college_id'],
        'collegeSlug' => $row['college_slug'],
        'collegeName' => $row['college_name'],
        'studentId' => $row['student_id'] ?? '',
        'studentName' => $row['student_name'],
        'studentEmail' => $row['student_email'],
        'studentPhone' => $row['student_phone'],
        'images' => is_array($images) ? $images : [],
        'edits' => is_array($edits) ? $edits : [],
        'note' => $row['note'],
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
    ];
}

/**
 * Merge an approved contribution's photos and field edits into the college.
 */
function apply_contribution(PDO $pdo, array $contribution): void
{
    $collegeId = $contribution['college_id'];

    // 1) Append proposed photos after existing ones
    $images = json_decode((string) ($contribution['images'] ?? '[]'), true);
    if (is_array($images) && $images !== []) {
        $orderStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM college_images WHERE college_id = ?');
        $orderStmt->execute([$collegeId]);
        $next = (int) ($orderStmt->fetch()['next'] ?? 0);
        $insert = $pdo->prepare('INSERT INTO college_images (college_id, image_url, sort_order) VALUES (?, ?, ?)');
        foreach ($images as $url) {
            $url = trim((string) $url);
            if ($url !== '') {
                $insert->execute([$collegeId, $url, $next++]);
            }
        }
    }

    // 2) Apply field edits
    $edits = json_decode((string) ($contribution['edits'] ?? '{}'), true);
    if (!is_array($edits)) {
        $edits = [];
    }

    $columnMap = [
        'about' => 'about',
        'location' => 'location',
        'principalName' => 'principal_name',
        'type' => 'type',
        'admissionStatus' => 'admission_status',
        'feesStructure' => 'fees_structure',
    ];
    $allowedType = ['government', 'semi-government', 'private'];
    $allowedAdmission = ['open', 'closed'];

    $sets = [];
    $params = [];
    foreach ($columnMap as $key => $column) {
        if (!array_key_exists($key, $edits)) {
            continue;
        }
        $value = trim((string) $edits[$key]);
        if ($value === '') {
            continue;
        }
        if ($key === 'type' && !in_array($value, $allowedType, true)) {
            continue;
        }
        if ($key === 'admissionStatus' && !in_array($value, $allowedAdmission, true)) {
            continue;
        }
        $sets[] = "$column = ?";
        $params[] = $value;
    }
    if ($sets !== []) {
        $params[] = $collegeId;
        $stmt = $pdo->prepare('UPDATE colleges SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $stmt->execute($params);
    }

    // 3) Append new branches (skip duplicates)
    if (isset($edits['branches']) && is_array($edits['branches'])) {
        $existingStmt = $pdo->prepare('SELECT name FROM college_branches WHERE college_id = ?');
        $existingStmt->execute([$collegeId]);
        $existing = array_map('strtolower', array_column($existingStmt->fetchAll(), 'name'));
        $insert = $pdo->prepare('INSERT INTO college_branches (college_id, name) VALUES (?, ?)');
        foreach ($edits['branches'] as $branch) {
            $branch = trim((string) $branch);
            if ($branch !== '' && !in_array(strtolower($branch), $existing, true)) {
                $insert->execute([$collegeId, $branch]);
                $existing[] = strtolower($branch);
            }
        }
    }
}

function insert_college_relations(PDO $pdo, string $collegeId, array $body): void
{
    $programIds = $body['programIds'] ?? $body['program_ids'] ?? [];
    if (is_array($programIds)) {
        $stmt = $pdo->prepare(
            'INSERT INTO college_programs (college_id, program_id) VALUES (?, ?)'
        );
        foreach ($programIds as $pid) {
            $pid = trim((string) $pid);
            if ($pid !== '') {
                $stmt->execute([$collegeId, $pid]);
            }
        }
    }

    $custom = $body['customPrograms'] ?? $body['custom_programs'] ?? [];
    if (is_array($custom)) {
        $stmt = $pdo->prepare(
            'INSERT INTO college_custom_programs (college_id, name) VALUES (?, ?)'
        );
        foreach ($custom as $name) {
            $name = trim((string) $name);
            if ($name !== '') {
                $stmt->execute([$collegeId, $name]);
            }
        }
    }

    $feeRows = $body['feeRows'] ?? $body['fee_rows'] ?? [];
    if (is_array($feeRows)) {
        $stmt = $pdo->prepare(
            'INSERT INTO college_fees (college_id, program_label, amount) VALUES (?, ?, ?)'
        );
        foreach ($feeRows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $label = trim((string) ($row['programLabel'] ?? $row['program_label'] ?? ''));
            $amount = trim((string) ($row['amount'] ?? ''));
            if ($label !== '' && $amount !== '') {
                $stmt->execute([$collegeId, $label, $amount]);
            }
        }
    }

    $branches = $body['branches'] ?? [];
    if (is_array($branches)) {
        $stmt = $pdo->prepare(
            'INSERT INTO college_branches (college_id, name) VALUES (?, ?)'
        );
        foreach ($branches as $branch) {
            $branch = trim((string) $branch);
            if ($branch !== '') {
                $stmt->execute([$collegeId, $branch]);
            }
        }
    }

    $images = $body['images'] ?? [];
    if (is_array($images)) {
        $stmt = $pdo->prepare(
            'INSERT INTO college_images (college_id, image_url, sort_order) VALUES (?, ?, ?)'
        );
        $i = 0;
        foreach ($images as $url) {
            $url = trim((string) $url);
            if ($url !== '') {
                $stmt->execute([$collegeId, $url, $i++]);
            }
        }
    }
}
