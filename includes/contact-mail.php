<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Send a plain-text contact form message. Uses SMTP when mail-config.php sets use_smtp.
 */
function nexastruct_send_contact_mail(
    string $defaultTo,
    string $fromLabel,
    string $replyToEmail,
    string $subject,
    string $plainBody
): bool {
    $root = dirname(__DIR__);
    $configFile = $root . '/mail-config.php';
    $cfg = is_readable($configFile) ? require $configFile : [];
    $to = isset($cfg['to_email']) && is_string($cfg['to_email']) && $cfg['to_email'] !== ''
        ? $cfg['to_email']
        : $defaultTo;

    if (!empty($cfg['use_smtp'])) {
        $autoload = $root . '/vendor/autoload.php';
        $phpmailerSrc = $root . '/vendor/phpmailer/phpmailer/src';
        if (is_readable($autoload)) {
            require_once $autoload;
        } elseif (is_readable($phpmailerSrc . '/PHPMailer.php')) {
            require_once $phpmailerSrc . '/Exception.php';
            require_once $phpmailerSrc . '/PHPMailer.php';
            require_once $phpmailerSrc . '/SMTP.php';
        } else {
            return false;
        }

        $smtp = $cfg['smtp'] ?? [];
        $host = (string)($smtp['host'] ?? '');
        $user = (string)($smtp['username'] ?? '');
        $pass = (string)($smtp['password'] ?? '');
        $fromEmail = (string)($cfg['from_email'] ?? $defaultTo);
        if ($host === '' || $user === '' || $pass === '' || $fromEmail === '') {
            return false;
        }

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            $mail->Port = (int)($smtp['port'] ?? 587);
            $enc = strtolower((string)($smtp['encryption'] ?? 'tls'));
            if ($enc === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } else {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            }
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            $mail->setFrom($fromEmail, $fromLabel);
            $mail->addAddress($to);
            $mail->addReplyTo($replyToEmail);
            $mail->Subject = $subject;
            $mail->Body = $plainBody;
            $mail->isHTML(false);
            return $mail->send();
        } catch (Exception) {
            return false;
        }
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $fromLabel . ' <' . $defaultTo . '>',
        'Reply-To: ' . $replyToEmail,
        'X-Mailer: PHP/' . PHP_VERSION,
    ];

    return @mail($to, $encodedSubject, $plainBody, implode("\r\n", $headers));
}
