<?php
/* AVA Bay Pilotage — stockage permanent des données (JSON) sur l'hébergement.
   Les données sont rangées HORS du dossier public : /home/<compte>/ava_data_demo (démo) */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$DATA = dirname(__DIR__, 2) . '/ava_data_demo';
$CONF = $DATA . '/config.json';
if (!is_dir($DATA)) { @mkdir($DATA, 0700, true); }
if (!is_dir($DATA . '/backups')) { @mkdir($DATA . '/backups', 0700, true); }

function out($code, $arr) { http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function valid_path($p) { return is_string($p) && strlen($p) < 400 && preg_match('#^[A-Za-z0-9_\-.~:@+/]+$#', $p) && strpos($p, '..') === false && $p[0] !== '/'; }
function file_for($DATA, $p) { return $DATA . '/' . str_replace('/', '__', $p) . '.json'; }

$action = $_GET['action'] ?? '';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$conf = is_file($CONF) ? json_decode(file_get_contents($CONF), true) : null;

if ($action === 'status') out(200, ['setup' => !$conf, 'https' => $https]);

if (!$https) out(403, ['error' => 'https_required']);

if ($action === 'setup') {
  if ($conf) out(409, ['error' => 'already_setup']);
  $in = json_decode(file_get_contents('php://input'), true);
  $code = trim($in['code'] ?? '');
  if (strlen($code) < 6) out(400, ['error' => 'code_too_short']);
  file_put_contents($CONF, json_encode(['hash' => password_hash($code, PASSWORD_DEFAULT), 'created' => date('c')]), LOCK_EX);
  @chmod($CONF, 0600);
  out(200, ['ok' => true]);
}

/* authentification par code d'accès d'équipe */
if (!$conf) out(401, ['error' => 'setup_required']);
$given = $_SERVER['HTTP_X_AVA_CODE'] ?? '';
if (!$given || !password_verify($given, $conf['hash'])) { usleep(800000); out(401, ['error' => 'bad_code']); }

if ($action === 'get') {
  $p = $_GET['path'] ?? '';
  if (!valid_path($p)) out(400, ['error' => 'bad_path']);
  $f = file_for($DATA, $p);
  if (!is_file($f)) out(200, ['exists' => false]);
  out(200, ['exists' => true, 'data' => json_decode(file_get_contents($f), true), 'mtime' => filemtime($f)]);
}

if ($action === 'list') {
  $prefix = $_GET['prefix'] ?? '';
  if (!valid_path(rtrim($prefix, '/') ?: 'x')) out(400, ['error' => 'bad_path']);
  $pre = str_replace('/', '__', $prefix);
  $docs = [];
  foreach (glob($DATA . '/' . $pre . '*.json') ?: [] as $f) {
    $rest = substr(basename($f, '.json'), strlen($pre));
    if ($rest === '' || strpos($rest, '__') !== false) continue;
    $docs[] = ['id' => $rest, 'data' => json_decode(file_get_contents($f), true)];
  }
  out(200, ['docs' => $docs]);
}

if ($action === 'set') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'post_only']);
  $p = $_GET['path'] ?? '';
  if (!valid_path($p)) out(400, ['error' => 'bad_path']);
  $raw = file_get_contents('php://input');
  if (strlen($raw) > 5 * 1024 * 1024) out(413, ['error' => 'too_large']);
  $data = json_decode($raw, true);
  if (!is_array($data)) out(400, ['error' => 'bad_json']);
  $f = file_for($DATA, $p);
  /* sauvegarde quotidienne : première écriture du jour → copie de la version précédente */
  if (is_file($f)) {
    $bdir = $DATA . '/backups/' . date('Y-m-d');
    if (!is_dir($bdir)) @mkdir($bdir, 0700, true);
    $bf = $bdir . '/' . basename($f);
    if (!is_file($bf)) @copy($f, $bf);
  }
  $tmp = $f . '.tmp' . getmypid();
  file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
  rename($tmp, $f);
  @chmod($f, 0600);
  out(200, ['ok' => true, 'mtime' => filemtime($f)]);
}

out(400, ['error' => 'unknown_action']);
