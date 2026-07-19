<?php
declare(strict_types=1);

function print_storage_dir(): string
{
    $dir = __DIR__ . '/../storage/prints';
    if (!is_dir($dir)) {
        if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('Cannot create storage/prints — check Hostinger folder permissions.');
        }
    }
    // Ensure .htaccess deny remains (block direct URL access)
    $ht = $dir . '/.htaccess';
    if (!is_file($ht)) {
        @file_put_contents($ht, "Deny from all\n");
    }
    return $dir;
}

function print_encryption_key(): string
{
    $key = (string) (app_config()['print_encryption_key'] ?? '');
    if ($key === '') {
        $key = (string) (app_config()['admin_secret'] ?? 'educonnect-print-key');
    }
    return hash('sha256', $key, true);
}

function print_encrypt_bytes(string $plain): string
{
    $iv = random_bytes(16);
    $cipher = openssl_encrypt($plain, 'AES-256-CBC', print_encryption_key(), OPENSSL_RAW_DATA, $iv);
    if ($cipher === false) {
        throw new RuntimeException('Failed to encrypt PDF.');
    }
    return $iv . $cipher;
}

function print_decrypt_bytes(string $blob): string
{
    if (strlen($blob) < 17) {
        throw new RuntimeException('Corrupt encrypted PDF.');
    }
    $iv = substr($blob, 0, 16);
    $cipher = substr($blob, 16);
    $plain = openssl_decrypt($cipher, 'AES-256-CBC', print_encryption_key(), OPENSSL_RAW_DATA, $iv);
    if ($plain === false) {
        throw new RuntimeException(
            'Failed to decrypt PDF. Keep print_encryption_key the same in config.php after upload.'
        );
    }
    return $plain;
}

function print_store_encrypted_file(string $pdfId, string $binary): string
{
    $dir = print_storage_dir();
    if (!is_writable($dir)) {
        throw new RuntimeException('storage/prints is not writable on the server.');
    }
    $relative = $pdfId . '.bin';
    $full = $dir . '/' . $relative;
    $ok = file_put_contents($full, print_encrypt_bytes($binary));
    if ($ok === false || !is_file($full)) {
        throw new RuntimeException('Failed to store PDF file on server.');
    }
    return $relative;
}

function print_load_decrypted_file(string $relativePath): string
{
    $dir = print_storage_dir();
    $safe = basename(str_replace('\\', '/', $relativePath));
    if ($safe === '' || $safe === '.' || $safe === '..' || !str_ends_with($safe, '.bin')) {
        throw new RuntimeException('Invalid PDF storage path.');
    }

    $full = $dir . '/' . $safe;
    if (!is_file($full) || !is_readable($full)) {
        throw new RuntimeException(
            'PDF file not found on server. Admin must re-upload this PDF (file missing in api/storage/prints/).'
        );
    }

    $blob = file_get_contents($full);
    if ($blob === false || $blob === '') {
        throw new RuntimeException('Unable to read PDF file.');
    }
    return print_decrypt_bytes($blob);
}

/**
 * Grant credits after successful payment. Idempotent per cashfree_order_id.
 */
function print_fulfill_order(string $orderId): array
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM print_orders WHERE id = ? OR cashfree_order_id = ? LIMIT 1 FOR UPDATE');
        $stmt->execute([$orderId, $orderId]);
        $order = $stmt->fetch();
        if (!$order) {
            $pdo->rollBack();
            throw new RuntimeException('Order not found.');
        }

        if ($order['status'] === 'paid') {
            $pdo->commit();
            return $order;
        }

        $pdo->prepare(
            "UPDATE print_orders SET status = 'paid', paid_at = NOW() WHERE id = ?"
        )->execute([$order['id']]);

        $find = $pdo->prepare(
            'SELECT * FROM print_purchases WHERE student_id = ? AND pdf_id = ? LIMIT 1 FOR UPDATE'
        );
        $find->execute([$order['student_id'], $order['pdf_id']]);
        $purchase = $find->fetch();

        if ($purchase) {
            $pdo->prepare(
                'UPDATE print_purchases
                 SET credits_total = credits_total + ?,
                     amount_paid = amount_paid + ?,
                     cashfree_order_id = ?,
                     status = \'paid\',
                     updated_at = NOW()
                 WHERE id = ?'
            )->execute([
                (int) $order['credits'],
                (float) $order['amount'],
                $order['cashfree_order_id'],
                $purchase['id'],
            ]);
        } else {
            $purchaseId = new_id('ppur');
            $pdo->prepare(
                'INSERT INTO print_purchases
                 (id, student_id, pdf_id, credits_total, credits_used, amount_paid, cashfree_order_id, status)
                 VALUES (?, ?, ?, ?, 0, ?, ?, \'paid\')'
            )->execute([
                $purchaseId,
                $order['student_id'],
                $order['pdf_id'],
                (int) $order['credits'],
                (float) $order['amount'],
                $order['cashfree_order_id'],
            ]);
        }

        $pdo->commit();
        $stmt->execute([$order['id'], $order['id']]);
        return $stmt->fetch() ?: $order;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function print_purchase_remaining(array $row): int
{
    return max(0, (int) $row['credits_total'] - (int) $row['credits_used']);
}

function print_map_purchase(array $row, ?array $pdf = null, ?array $student = null): array
{
    $remaining = print_purchase_remaining($row);
    return [
        'id' => $row['id'],
        'studentId' => $row['student_id'],
        'studentName' => $student['name'] ?? null,
        'pdfId' => $row['pdf_id'],
        'pdfTitle' => $pdf['title'] ?? ($row['pdf_title'] ?? null),
        'creditsTotal' => (int) $row['credits_total'],
        'creditsUsed' => (int) $row['credits_used'],
        'remaining' => $remaining,
        'amountPaid' => (float) $row['amount_paid'],
        'status' => $row['status'],
        'purchasedAt' => $row['purchased_at'],
    ];
}

function print_file_exists(string $relativePath): bool
{
    $safe = basename(str_replace('\\', '/', $relativePath));
    if ($safe === '' || !str_ends_with($safe, '.bin')) {
        return false;
    }
    try {
        $full = print_storage_dir() . '/' . $safe;
    } catch (Throwable $e) {
        return false;
    }
    return is_file($full) && is_readable($full);
}

function print_map_pdf(array $row, bool $includePath = false): array
{
    $out = [
        'id' => $row['id'],
        'title' => $row['title'],
        'pricePerCredit' => (float) $row['price_per_credit'],
        'enabled' => (int) $row['enabled'] === 1,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'] ?? null,
    ];
    if ($includePath) {
        $path = (string) ($row['file_path'] ?? '');
        $out['hasFile'] = $path !== '' && print_file_exists($path);
        $out['fileMissing'] = $path !== '' && !$out['hasFile'];
    }
    return $out;
}
