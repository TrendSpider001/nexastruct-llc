<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$usersFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'users.json';

function respond($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data);
  exit;
}

function read_users($file) {
  if (!file_exists($file)) {
    return [];
  }
  $raw = file_get_contents($file);
  if ($raw === false || trim($raw) === '') {
    return [];
  }
  $parsed = json_decode($raw, true);
  return is_array($parsed) ? $parsed : [];
}

function write_users($file, $users) {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  $ok = file_put_contents(
    $file,
    json_encode(array_values($users), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
    LOCK_EX
  );
  return $ok !== false;
}

function normalize_role($role) {
  return $role === 'admin' ? 'admin' : 'user';
}

function public_user($user) {
  return [
    'id' => $user['id'],
    'username' => $user['username'],
    'role' => normalize_role(isset($user['role']) ? $user['role'] : 'user'),
  ];
}

function find_user($users, $username) {
  $key = strtolower(trim((string) $username));
  foreach ($users as $user) {
    if (strtolower($user['username']) === $key) {
      return $user;
    }
  }
  return null;
}

function admin_count($users) {
  $count = 0;
  foreach ($users as $user) {
    if (normalize_role(isset($user['role']) ? $user['role'] : 'user') === 'admin') {
      $count++;
    }
  }
  return $count;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'GET' && ($action === 'list' || $action === '')) {
  $users = read_users($usersFile);
  $out = [];
  foreach ($users as $user) {
    $out[] = public_user($user);
  }
  respond(['ok' => true, 'users' => $out]);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
  $body = $_POST;
}

if ($method === 'POST' && $action === 'login') {
  $username = isset($body['username']) ? trim((string) $body['username']) : '';
  $password = isset($body['password']) ? (string) $body['password'] : '';
  $users = read_users($usersFile);
  $user = find_user($users, $username);

  if (!$user || !hash_equals((string) $user['password'], $password)) {
    respond(['ok' => false, 'error' => 'Incorrect username or password.'], 401);
  }

  respond(['ok' => true, 'user' => public_user($user)]);
}

if ($method === 'POST' && $action === 'create') {
  $username = isset($body['username']) ? trim((string) $body['username']) : '';
  $password = isset($body['password']) ? (string) $body['password'] : '';
  $role = normalize_role(isset($body['role']) ? $body['role'] : 'user');

  if ($username === '') {
    respond(['ok' => false, 'error' => 'Username is required.'], 400);
  }
  if (strlen($username) < 3) {
    respond(['ok' => false, 'error' => 'Username must be at least 3 characters.'], 400);
  }
  if (!preg_match('/^[a-zA-Z0-9._-]+$/', $username)) {
    respond(['ok' => false, 'error' => 'Username can only use letters, numbers, . _ -'], 400);
  }
  if (strlen($password) < 6) {
    respond(['ok' => false, 'error' => 'Password must be at least 6 characters.'], 400);
  }

  $users = read_users($usersFile);
  if (find_user($users, $username)) {
    respond(['ok' => false, 'error' => 'That username already exists.'], 400);
  }

  $user = [
    'id' => 'user-' . uniqid('', true),
    'username' => $username,
    'password' => $password,
    'role' => $role,
  ];
  $users[] = $user;

  if (!write_users($usersFile, $users)) {
    respond(['ok' => false, 'error' => 'Could not save user file. Check data/ folder permissions.'], 500);
  }

  respond(['ok' => true, 'user' => public_user($user)]);
}

if ($method === 'POST' && $action === 'updateRole') {
  $id = isset($body['id']) ? (string) $body['id'] : '';
  $role = normalize_role(isset($body['role']) ? $body['role'] : 'user');
  $users = read_users($usersFile);
  $found = false;

  foreach ($users as &$user) {
    if ($user['id'] === $id) {
      $found = true;
      $currentRole = normalize_role(isset($user['role']) ? $user['role'] : 'user');
      if ($currentRole === 'admin' && $role !== 'admin' && admin_count($users) <= 1) {
        respond(['ok' => false, 'error' => 'At least one admin account is required.'], 400);
      }
      $user['role'] = $role;
      break;
    }
  }
  unset($user);

  if (!$found) {
    respond(['ok' => false, 'error' => 'User not found.'], 404);
  }
  if (!write_users($usersFile, $users)) {
    respond(['ok' => false, 'error' => 'Could not save user file.'], 500);
  }

  $updated = null;
  foreach ($users as $user) {
    if ($user['id'] === $id) {
      $updated = public_user($user);
      break;
    }
  }
  respond(['ok' => true, 'user' => $updated]);
}

if ($method === 'POST' && $action === 'delete') {
  $id = isset($body['id']) ? (string) $body['id'] : '';
  $actor = isset($body['actorUsername']) ? strtolower(trim((string) $body['actorUsername'])) : '';
  $users = read_users($usersFile);
  $target = null;

  foreach ($users as $user) {
    if ($user['id'] === $id) {
      $target = $user;
      break;
    }
  }

  if (!$target) {
    respond(['ok' => false, 'error' => 'User not found.'], 404);
  }
  if (strtolower($target['username']) === $actor) {
    respond(['ok' => false, 'error' => 'You cannot delete your own account.'], 400);
  }
  if (normalize_role(isset($target['role']) ? $target['role'] : 'user') === 'admin' && admin_count($users) <= 1) {
    respond(['ok' => false, 'error' => 'At least one admin account is required.'], 400);
  }

  $users = array_values(array_filter($users, function ($user) use ($id) {
    return $user['id'] !== $id;
  }));

  if (!write_users($usersFile, $users)) {
    respond(['ok' => false, 'error' => 'Could not save user file.'], 500);
  }

  respond(['ok' => true]);
}

if ($method === 'POST' && $action === 'bootstrap') {
  $users = read_users($usersFile);
  if (count($users) > 0) {
    $out = [];
    foreach ($users as $user) {
      $out[] = public_user($user);
    }
    respond(['ok' => true, 'users' => $out, 'seeded' => false]);
  }

  $seed = isset($body['users']) && is_array($body['users']) ? $body['users'] : [];
  $next = [];
  foreach ($seed as $index => $item) {
    $username = isset($item['username']) ? trim((string) $item['username']) : '';
    if ($username === '') {
      continue;
    }
    $next[] = [
      'id' => 'seed-' . $index . '-' . strtolower($username),
      'username' => $username,
      'password' => isset($item['password']) ? (string) $item['password'] : '',
      'role' => normalize_role(isset($item['role']) ? $item['role'] : ($index === 0 ? 'admin' : 'user')),
    ];
  }

  if (!$next) {
    respond(['ok' => false, 'error' => 'No seed users provided.'], 400);
  }
  if (!write_users($usersFile, $next)) {
    respond(['ok' => false, 'error' => 'Could not save user file. Check data/ folder permissions.'], 500);
  }

  $out = [];
  foreach ($next as $user) {
    $out[] = public_user($user);
  }
  respond(['ok' => true, 'users' => $out, 'seeded' => true]);
}

respond(['ok' => false, 'error' => 'Unknown action.'], 404);
