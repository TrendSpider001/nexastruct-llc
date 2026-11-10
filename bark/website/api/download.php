<?php
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

function fail($message, $code = 400) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => $message]);
  exit;
}

$url = isset($_GET['url']) ? trim((string) $_GET['url']) : '';
$filename = isset($_GET['filename']) ? trim((string) $_GET['filename']) : 'attachment';

if ($url === '') {
  fail('Missing url');
}

$parts = parse_url($url);
if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
  fail('Invalid url');
}

$scheme = strtolower($parts['scheme']);
if ($scheme !== 'http' && $scheme !== 'https') {
  fail('Unsupported url scheme');
}

$host = strtolower($parts['host']);
$allowedHosts = [
  'bark-user-data.s3.amazonaws.com',
  's3.amazonaws.com',
];

$allowed = in_array($host, $allowedHosts, true);
if (!$allowed && !preg_match('/\.s3[.\-][a-z0-9\-]*\.amazonaws\.com$/i', $host)) {
  fail('Host not allowed', 403);
}

$safeName = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename);
if ($safeName === '' || $safeName === '.' || $safeName === '..') {
  $safeName = 'attachment';
}

function fetch_binary($url) {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_CONNECTTIMEOUT => 15,
      CURLOPT_TIMEOUT => 60,
      CURLOPT_USERAGENT => 'Sheetline/1.0',
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_HEADER => true,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
      return [null, 0, '', $error ?: 'cURL request failed'];
    }

    $body = substr($raw, $headerSize);
    return [$body, $status, $contentType, ''];
  }

  $context = stream_context_create([
    'http' => [
      'method' => 'GET',
      'timeout' => 60,
      'header' => "User-Agent: Sheetline/1.0\r\n",
      'follow_location' => 1,
    ],
  ]);
  $body = @file_get_contents($url, false, $context);
  if ($body === false) {
    return [null, 0, '', 'file_get_contents request failed'];
  }

  $status = 200;
  $contentType = 'application/octet-stream';
  if (isset($http_response_header) && is_array($http_response_header)) {
    foreach ($http_response_header as $headerLine) {
      if (preg_match('/^HTTP\/\S+\s+(\d+)/i', $headerLine, $m)) {
        $status = (int) $m[1];
      }
      if (stripos($headerLine, 'Content-Type:') === 0) {
        $contentType = trim(substr($headerLine, strlen('Content-Type:')));
      }
    }
  }

  return [$body, $status, $contentType, ''];
}

list($body, $status, $contentType, $error) = fetch_binary($url);

if ($body === null || $status < 200 || $status >= 300) {
  fail($error ?: ('Download failed (' . $status . ')'), 502);
}

if (!$contentType) {
  $contentType = 'application/octet-stream';
}

header('Content-Type: ' . $contentType);
header('Content-Disposition: attachment; filename="' . $safeName . '"');
header('Content-Length: ' . strlen($body));
echo $body;
exit;
