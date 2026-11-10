<?php
header('Content-Type: text/csv; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

$csvFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'sheet.csv';

function fail($message, $code = 400) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => $message]);
  exit;
}

function fetch_url($url) {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_CONNECTTIMEOUT => 15,
      CURLOPT_TIMEOUT => 45,
      CURLOPT_USERAGENT => 'Sheetline/1.0',
      CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
      return [null, 0, $error ?: 'cURL request failed'];
    }
    return [$body, $status, ''];
  }

  $context = stream_context_create([
    'http' => [
      'method' => 'GET',
      'timeout' => 45,
      'header' => "User-Agent: Sheetline/1.0\r\n",
      'follow_location' => 1,
    ],
  ]);
  $body = @file_get_contents($url, false, $context);
  if ($body === false) {
    return [null, 0, 'file_get_contents request failed'];
  }

  $status = 200;
  if (isset($http_response_header) && is_array($http_response_header)) {
    foreach ($http_response_header as $line) {
      if (preg_match('/^HTTP\/\S+\s+(\d+)/', $line, $match)) {
        $status = (int) $match[1];
      }
    }
  }

  return [$body, $status, ''];
}

$sheetId = isset($_GET['sheetId']) ? trim((string) $_GET['sheetId']) : '';
$gid = isset($_GET['gid']) ? trim((string) $_GET['gid']) : '0';
$persist = !isset($_GET['persist']) || $_GET['persist'] !== '0';

if ($sheetId === '' || !preg_match('/^[a-zA-Z0-9-_]{20,}$/', $sheetId)) {
  fail('Valid sheetId is required.');
}
if ($gid === '' || !preg_match('/^[0-9]+$/', $gid)) {
  $gid = '0';
}

$urls = [
  'https://docs.google.com/spreadsheets/d/' . rawurlencode($sheetId) .
    '/gviz/tq?tqx=out:csv&gid=' . rawurlencode($gid) . '&headers=1&_=' . time(),
  'https://docs.google.com/spreadsheets/d/' . rawurlencode($sheetId) .
    '/export?format=csv&gid=' . rawurlencode($gid),
];

$csv = null;
$lastError = 'Could not reach Google Sheets.';

foreach ($urls as $url) {
  list($body, $status, $error) = fetch_url($url);
  if ($body === null || $status < 200 || $status >= 400) {
    $lastError = $error !== '' ? $error : ('Google returned HTTP ' . $status);
    continue;
  }

  $trimmed = ltrim($body);
  // Login/HTML pages mean the sheet is not publicly accessible.
  if ($trimmed === '' || stripos($trimmed, '<!DOCTYPE') === 0 || stripos($trimmed, '<html') === 0) {
    $lastError = 'Google Sheet is not publicly viewable. Share it as "Anyone with the link can view".';
    continue;
  }

  $csv = $body;
  break;
}

if ($csv === null) {
  fail($lastError, 502);
}

if ($persist) {
  $dir = dirname($csvFile);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  if (@file_put_contents($csvFile, $csv, LOCK_EX) === false) {
    // Still return fresh data even if the local snapshot cannot be written.
    header('X-Sheetline-Persist: failed');
  } else {
    header('X-Sheetline-Persist: ok');
  }
}

header('X-Sheetline-Source: google');
echo $csv;
