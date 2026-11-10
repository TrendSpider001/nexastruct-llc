<?php
/**
 * Copy this file to mail-config.php and fill in your SMTP details.
 * mail-config.php is blocked from direct web access via .htaccess.
 *
 * Hostinger (hPanel): Emails → pick domain → Manage → Connect Apps & Devices
 * shows the same SMTP values. Username is the full mailbox address.
 */
declare(strict_types=1);

return [
    // Set true on almost all modern hosts — PHP mail() alone usually fails.
    'use_smtp' => true,
    'smtp' => [
        // Hostinger outgoing server (official): TLS on 587
        'host' => 'smtp.hostinger.com',
        'port' => 587,
        // Full email address of the mailbox, e.g. contact@nexastruct.org
        'username' => 'contact@nexastruct.org',
        'password' => 'YOUR_MAILBOX_PASSWORD',
        'encryption' => 'tls',
    ],
    // Usually the same mailbox you send as (must exist in Hostinger Email)
    'from_email' => 'contact@nexastruct.org',
    // Where contact form messages are delivered (defaults to contact@nexastruct.org in mail scripts if omitted)
    'to_email' => 'contact@nexastruct.org',
];
