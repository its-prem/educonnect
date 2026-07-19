<?php
declare(strict_types=1);

function cashfree_config(): array
{
    $c = app_config()['cashfree'] ?? [];
    return [
        'env' => (string) ($c['env'] ?? 'mock'),
        'app_id' => (string) ($c['app_id'] ?? ''),
        'secret_key' => (string) ($c['secret_key'] ?? ''),
        'webhook_secret' => (string) ($c['webhook_secret'] ?? ($c['secret_key'] ?? '')),
    ];
}

function cashfree_is_mock(): bool
{
    $c = cashfree_config();
    if ($c['env'] === 'mock') {
        return true;
    }
    return $c['app_id'] === '' || $c['secret_key'] === '';
}

function cashfree_base_url(): string
{
    $env = cashfree_config()['env'];
    return $env === 'production'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
}

/**
 * @return array{order_id: string, payment_session_id: string, mock?: bool}
 */
function cashfree_create_order(array $input): array
{
    $orderId = (string) $input['order_id'];
    $amount = (float) $input['amount'];
    $customerId = (string) $input['customer_id'];
    $customerPhone = (string) $input['customer_phone'];
    $customerEmail = (string) ($input['customer_email'] ?? '');
    $customerName = (string) ($input['customer_name'] ?? '');
    $returnUrl = (string) $input['return_url'];
    $notifyUrl = (string) ($input['notify_url'] ?? '');

    if (cashfree_is_mock()) {
        return [
            'order_id' => $orderId,
            'payment_session_id' => 'mock_session_' . $orderId,
            'mock' => true,
        ];
    }

    $cfg = cashfree_config();
    $body = [
        'order_id' => $orderId,
        'order_amount' => round($amount, 2),
        'order_currency' => 'INR',
        'customer_details' => [
            'customer_id' => preg_replace('/[^a-zA-Z0-9_-]/', '_', $customerId) ?: 'student',
            'customer_phone' => $customerPhone !== '' ? $customerPhone : '9999999999',
            'customer_email' => $customerEmail !== '' ? $customerEmail : 'student@example.com',
            'customer_name' => $customerName !== '' ? $customerName : 'Student',
        ],
        'order_meta' => [
            'return_url' => $returnUrl,
        ],
    ];
    if ($notifyUrl !== '') {
        $body['order_meta']['notify_url'] = $notifyUrl;
    }

    $ch = curl_init(cashfree_base_url() . '/orders');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-version: 2023-08-01',
            'x-client-id: ' . $cfg['app_id'],
            'x-client-secret: ' . $cfg['secret_key'],
        ],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_SLASHES),
        CURLOPT_TIMEOUT => 30,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        throw new RuntimeException('Cashfree request failed: ' . $err);
    }

    $data = json_decode($raw, true);
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        $msg = is_array($data) ? (string) ($data['message'] ?? $raw) : $raw;
        throw new RuntimeException('Cashfree create order failed: ' . $msg);
    }

    $sessionId = (string) ($data['payment_session_id'] ?? '');
    if ($sessionId === '') {
        throw new RuntimeException('Cashfree did not return payment_session_id.');
    }

    return [
        'order_id' => (string) ($data['order_id'] ?? $orderId),
        'payment_session_id' => $sessionId,
        'mock' => false,
    ];
}

/**
 * @return array{order_status: string, order_id: string}
 */
function cashfree_fetch_order(string $orderId): array
{
    if (cashfree_is_mock()) {
        return ['order_status' => 'PAID', 'order_id' => $orderId];
    }

    $cfg = cashfree_config();
    $ch = curl_init(cashfree_base_url() . '/orders/' . rawurlencode($orderId));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'x-api-version: 2023-08-01',
            'x-client-id: ' . $cfg['app_id'],
            'x-client-secret: ' . $cfg['secret_key'],
        ],
        CURLOPT_TIMEOUT => 30,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = is_string($raw) ? json_decode($raw, true) : null;
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        throw new RuntimeException('Cashfree fetch order failed.');
    }

    return [
        'order_status' => strtoupper((string) ($data['order_status'] ?? '')),
        'order_id' => (string) ($data['order_id'] ?? $orderId),
    ];
}

function cashfree_verify_webhook_signature(string $rawBody, string $timestamp, string $signature): bool
{
    $secret = cashfree_config()['webhook_secret'];
    if ($secret === '' || cashfree_is_mock()) {
        return true;
    }
    $signed = $timestamp . $rawBody;
    $expected = base64_encode(hash_hmac('sha256', $signed, $secret, true));
    return hash_equals($expected, $signature);
}
