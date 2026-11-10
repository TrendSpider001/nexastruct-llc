<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/contact-mail.php';

header('Content-Type: text/plain; charset=UTF-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

$to = 'contact@nexastruct.org';
$fromLabel = 'NexaStruct Website';
$siteUrl = 'https://nexastruct.org';

function field(string $key): string
{
    return isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
}

$name = field('name');
$email = field('email');
$phone = field('phone');
$address = field('address');
$note = field('note');

if ($name === '' || strlen($name) < 2) {
    http_response_code(400);
    exit('Invalid name');
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('Invalid email');
}
if ($phone === '') {
    http_response_code(400);
    exit('Invalid phone');
}
if ($address === '') {
    http_response_code(400);
    exit('Invalid address');
}

$body = "Name: {$name}\r\nEmail: {$email}\r\nPhone: {$phone}\r\nAddress: {$address}\r\n\r\nMessage:\r\n{$note}\r\n\r\n---\r\nSubmitted via: {$siteUrl}\r\n";
$subject = "[{$fromLabel}] Contact page inquiry";

$ok = nexastruct_send_contact_mail($to, $fromLabel, $email, $subject, $body);

if (!$ok) {
    http_response_code(500);
    exit('Send failed');
}

echo 'OK';
