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
$subjectLine = field('subject');
$note = field('note');

if ($name === '' || strlen($name) < 2) {
    http_response_code(400);
    exit('Invalid name');
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('Invalid email');
}
if ($subjectLine === '') {
    http_response_code(400);
    exit('Invalid subject');
}

$body = "Name: {$name}\r\nEmail: {$email}\r\nSubject: {$subjectLine}\r\n\r\nMessage:\r\n{$note}\r\n\r\n---\r\nSubmitted via: {$siteUrl}\r\n";
$subject = "[{$fromLabel}] {$subjectLine}";

$ok = nexastruct_send_contact_mail($to, $fromLabel, $email, $subject, $body);

if (!$ok) {
    http_response_code(500);
    exit('Send failed');
}

echo 'OK';
