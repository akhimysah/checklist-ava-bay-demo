<?php
/* AVA Bay — Suivi quotidien (démo) : compte rendu e-mail automatique (11h et 20h, heure de Marrakech).
   Même mécanique que l'application actuelle (tâche cron chaque heure, un seul envoi par créneau),
   mais le contenu reprend la nouvelle checklist : personnel, espaces et mise en place,
   parcours clientes, messages envoyés, bilan / priorités du lendemain.
   Usage manuel : php rapport.php dry 11   (affiche le message sans l'envoyer)
                  php rapport.php force 20 (envoie tout de suite le compte rendu de 20h) */
if (php_sapi_name() !== 'cli') { http_response_code(404); exit; }
date_default_timezone_set('Africa/Casablanca');

$TO   = ['i.fanni2416@gmail.com', 'Nikkkel@live.fr', 'n.guelli@oriionglobal.com'];
$FROM = 'rapport@avabay-marrakech.com';
$SLOTS = [11 => 'Point de 11h', 20 => 'Compte rendu de 20h'];
$LINK = 'https://checklist.avabay-marrakech.com';

$DATA = __DIR__;
$mode = $argv[1] ?? '';
$slot = isset($argv[2]) ? (int)$argv[2] : (int)date('G');
if (!isset($SLOTS[$slot])) exit(0);
$day = date('Y-m-d');
$mdir = $DATA . '/rapport-envoyes';
if (!is_dir($mdir)) @mkdir($mdir, 0700, true);
$marker = "$mdir/$day-$slot";
if ($mode === '' && is_file($marker)) exit(0);

$f = "$DATA/jours__jour-{$day}__parts__resume.json";
$R = is_file($f) ? json_decode(file_get_contents($f), true) : null;

function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function fr_date($d) { $j = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']; $m = ['','janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']; $t = strtotime($d . ' 12:00'); return $j[(int)date('w', $t)] . ' ' . (int)date('j', $t) . ' ' . $m[(int)date('n', $t)] . ' ' . date('Y', $t); }
function hm($t) { return $t ? str_replace(':', 'h', $t) : ''; }
function h2($t) { return '<h2 style="font:600 17px Georgia,serif;color:#3E2B22;margin:26px 0 8px;border-bottom:1px solid #E6D9CE;padding-bottom:6px">' . e($t) . '</h2>'; }
function pill($t, $bg, $fg) { return '<span style="display:inline-block;padding:2px 9px;border-radius:99px;background:' . $bg . ';color:' . $fg . ';font-size:12px;font-weight:bold">' . e($t) . '</span>'; }
function line($label, $val) { return $val === '' || $val === null ? '' : '<p style="margin:4px 0"><b>' . e($label) . ' :</b> ' . nl2br(e($val)) . '</p>'; }
function card($col, $inner) { return '<div style="margin:8px 0;padding:9px 12px;border-left:4px solid ' . $col . ';background:#FBF7F3;border-radius:6px;font-size:14px">' . $inner . '</div>'; }

$C = ['ok' => ['#DFEBE2', '#2F5A3E'], 'fix' => ['#F8E3CF', '#8A4B12'], 'urg' => ['#F6D6D0', '#9B2C1D'], 'na' => ['#EEE7E0', '#6B5B50'], '' => ['#EEE7E0', '#6B5B50']];
$title = $SLOTS[$slot] . ' — ' . fr_date($day);
$b = '';

/* résumé absent (appareil pas encore à jour) : on le reconstruit à partir des parties brutes */
if (!$R) {
  $raw = [];
  foreach (glob("$DATA/jours__jour-{$day}__parts__*.json") ?: [] as $pf) {
    $k = substr(basename($pf, '.json'), strlen("jours__jour-{$day}__parts__"));
    if ($k !== 'resume') $raw[$k] = json_decode(file_get_contents($pf), true);
  }
  if ($raw) {
    $CS = ['ok' => 'Prêt', 'fix' => 'À corriger', 'na' => 'Non concerné', '' => 'À vérifier'];
    $PS = ['ok' => 'Présent', 'late' => 'Retard', 'abs' => 'Absent', 'np' => 'Non prévu', '' => 'À renseigner'];
    $CHECKS = [
      ['title' => 'Propreté des espaces', 'items' => [['clean-reception','Accueil / réception'],['clean-changing','Vestiaires'],['clean-toilets','Sanitaires'],['clean-prayer','Salle de prière'],['clean-pool','Piscine et espaces extérieurs'],['clean-dining','Salle de restauration'],['clean-spa','Spa, hammam et beauté'],['clean-kids','AVA LAND'],['clean-coworking','Coworking / espaces communs']]],
      ['title' => 'Mise en place', 'items' => [['tv','Télévisions allumées'],['music','Musique allumée'],['tables','Tables dressées'],['loungers','Transats installés'],['towels','Serviettes disponibles'],['hammam','Hammam allumé']]],
    ];
    $R = ['date' => $day, 'staff' => ['total' => 0, 'ok' => 0, 'late' => 0, 'abs' => 0, 'np' => 0, 'rows' => []], 'checks' => ['n' => 0, 'ready' => 0, 'fix' => 0, 'na' => 0, 'todo' => 0, 'groups' => []], 'clientes' => ['n' => 0, 'sent' => 0, 'depense' => 0, 'rows' => [], 'retours' => []], 'messages' => [], 'bilan' => ['note' => $raw['bilan']['note'] ?? ''], 'partial' => true];
    foreach ($raw['staff']['rows'] ?? [] as $r) {
      $q = !empty($r['np']) ? 'np' : (($r['present'] ?? null) === false ? 'abs' : (!empty($r['retard']) ? 'late' : (!empty($r['present']) ? 'ok' : '')));
      $R['staff']['total']++; if ($q) $R['staff'][$q]++;
      $R['staff']['rows'][] = ['nom' => $r['nom'] ?? '', 'serv' => $r['serv'] ?? '', 'st' => $q, 'label' => $PS[$q], 'arr' => in_array($q, ['ok', 'late']) ? ($r['arr'] ?? '') : '', 'obs' => $r['obs'] ?? ''];
    }
    $items = $raw['checks']['items'] ?? [];
    foreach ($CHECKS as $g) {
      $rows = [];
      foreach ($g['items'] as [$id, $label]) { $c = $items[$id] ?? []; $s = $c['s'] ?? ''; $R['checks']['n']++; if ($s === 'ok') $R['checks']['ready']++; elseif ($s === 'fix') $R['checks']['fix']++; elseif ($s === 'na') $R['checks']['na']++; else $R['checks']['todo']++; $rows[] = ['label' => $label, 's' => $s, 'status' => $CS[$s] ?? $s, 'note' => $c['note'] ?? '', 'r' => $c['r'] ?? '', 'h' => $c['h'] ?? '']; }
      $R['checks']['groups'][] = ['title' => $g['title'], 'items' => $rows];
    }
    $RT = ['comp' => 'Compliment', 'recl' => 'Réclamation', 'dem' => 'Demande particulière', 'inc' => 'Incident', 'avis' => 'Avis en ligne'];
    $VN = ['seule' => 'Seule', 'amie' => 'Avec une amie', 'enfants' => 'Avec ses enfants', 'famille' => 'En famille'];
    $cl = $raw['client']['rows'] ?? []; usort($cl, fn($x, $y) => strcmp($x['h'] ?? '', $y['h'] ?? ''));
    foreach ($cl as $fc) {
      $nm = trim(($fc['prenom'] ?? '') . ' ' . ($fc['nom'] ?? '')) ?: ($fc['nomComplet'] ?? 'Cliente');
      $steps = $fc['steps'] ?? []; usort($steps, fn($x, $y) => strcmp($x['time'] ?? '', $y['time'] ?? ''));
      $st = array_map(fn($x) => ['time' => $x['time'] ?? '', 'act' => $x['act'] ?? '', 'ok' => !empty($x['ok']), 'note' => $x['note'] ?? ''], $steps);
      $R['clientes']['n']++; if (!empty($fc['sentAt'])) $R['clientes']['sent']++; $R['clientes']['depense'] += (float)($fc['montant'] ?? 0);
      $type = $RT[$fc['type'] ?? ''] ?? '';
      $R['clientes']['rows'][] = ['nom' => $nm, 'bracelet' => $fc['bracelet'] ?? '', 'h' => $fc['h'] ?? '', 'dep' => $fc['dep'] ?? '', 'venue' => $VN[$fc['venue'] ?? ''] ?? '', 'steps' => $st, 'montant' => isset($fc['montant']) && $fc['montant'] !== '' ? (float)$fc['montant'] : null, 'statut' => !empty($fc['sentAt']) ? 'Envoyé sur WhatsApp' : ($st ? 'En préparation' : 'Nouvelle'), 'type' => $type, 'motif' => $fc['motif'] ?? '', 'rep' => $fc['rep'] ?? '', 'traite' => ($fc['st'] ?? '') === 'done'];
      if ($type) $R['clientes']['retours'][] = ['nom' => $nm, 'type' => $type, 'motif' => $fc['motif'] ?? '', 'rep' => $fc['rep'] ?? '', 'traite' => ($fc['st'] ?? '') === 'done'];
      if (!empty($fc['sentAt'])) $R['messages'][] = ['nom' => $nm, 'tel' => $fc['tel'] ?? '', 'canal' => 'WhatsApp', 'sentAt' => $fc['sentAt'], 'body' => 'Programme envoyé : ' . implode(' → ', array_map(fn($x) => trim(hm($x['time']) . ' ' . $x['act']), $st))];
    }
  }
}

if (!$R) {
  $b .= '<p style="margin:14px 0;padding:12px 14px;background:#F8E3CF;border-radius:10px;color:#8A4B12"><b>Aucune donnée n\'est arrivée sur le serveur aujourd\'hui.</b><br>Les saisies doivent être faites sur <a href="' . $LINK . '" style="color:#8A4B12">l\'application de l\'équipe</a>, avec le code d\'accès. Les saisies faites en mode « sans synchronisation » restent sur l\'appareil et n\'apparaissent pas ici.</p>';
} else {
  if (!empty($R['partial'])) $b .= '<p style="margin:14px 0;padding:12px 14px;background:#F8E3CF;border-radius:10px;color:#8A4B12;font-size:13.5px">Compte rendu reconstruit à partir des saisies brutes : les appareils de l\'équipe doivent recharger l\'application une fois pour que le résumé complet soit disponible.</p>';

  /* --- personnel --- */
  $S = $R['staff'];
  $b .= h2('Personnel');
  $b .= '<p style="margin:4px 0">' . ((int)$S['ok'] + (int)$S['late']) . ' présent(s) sur ' . (int)$S['total'] . ' membre(s) renseigné(s)' . ($S['late'] ? ' · <span style="color:#8A4B12">' . (int)$S['late'] . ' en retard</span>' : '') . ($S['abs'] ? ' · <b style="color:#9B2C1D">' . (int)$S['abs'] . ' absent(s)</b>' : '') . ($S['np'] ? ' · ' . (int)$S['np'] . ' non prévu(s)' : '') . '.</p>';
  if ($S['rows']) {
    $b .= '<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13.5px">';
    foreach ($S['rows'] as $r) {
      $col = $C[$r['st'] === 'late' ? 'fix' : ($r['st'] === 'abs' ? 'urg' : ($r['st'] === 'ok' ? 'ok' : ''))];
      $b .= '<tr><td style="padding:6px 0;border-bottom:1px solid #F0E8E0"><b>' . e($r['nom']) . '</b>' . ($r['serv'] ? ' <span style="color:#6B5B50">· ' . e($r['serv']) . '</span>' : '') . ($r['obs'] ? '<br><i style="color:#6B5B50">' . e($r['obs']) . '</i>' : '') . '</td>'
          . '<td style="padding:6px 0 6px 10px;border-bottom:1px solid #F0E8E0;text-align:right;white-space:nowrap">' . pill($r['label'] . ($r['arr'] ? ' · ' . hm($r['arr']) : ''), $col[0], $col[1]) . '</td></tr>';
    }
    $b .= '</table>';
  } else $b .= '<p style="color:#6B5B50;margin:4px 0">Liste du personnel à renseigner.</p>';

  /* --- espaces et mise en place --- */
  $K = $R['checks'];
  $b .= h2('Espaces et mise en place');
  $b .= '<p style="margin:4px 0">' . (int)$K['ready'] . '/' . ((int)$K['n'] - (int)$K['na']) . ' points prêts' . ($K['fix'] ? ' · <b style="color:#9B2C1D">' . (int)$K['fix'] . ' à corriger</b>' : '') . ($K['todo'] ? ' · ' . (int)$K['todo'] . ' à vérifier' : '') . '.</p>';
  foreach ($K['groups'] as $g) {
    $b .= '<p style="margin:12px 0 4px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#6B5B50"><b>' . e($g['title']) . '</b></p>';
    $b .= '<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13.5px">';
    foreach ($g['items'] as $i) {
      $col = $C[$i['s']] ?? $C[''];
      $det = implode(' · ', array_filter([$i['note'], $i['r'] ? '→ ' . $i['r'] : '', hm($i['h'])]));
      $b .= '<tr><td style="padding:5px 0;border-bottom:1px solid #F0E8E0;' . ($i['s'] === 'fix' ? 'font-weight:bold;color:#9B2C1D' : '') . '">' . e($i['label']) . ($det ? '<br><span style="font-weight:normal;color:#6B5B50;font-size:12.5px">' . e($det) . '</span>' : '') . '</td>'
          . '<td style="padding:5px 0 5px 10px;border-bottom:1px solid #F0E8E0;text-align:right;white-space:nowrap">' . pill($i['status'], $col[0], $col[1]) . '</td></tr>';
    }
    $b .= '</table>';
  }

  /* --- parcours clientes --- */
  $cl = $R['clientes'];
  $b .= h2('Parcours clientes (' . (int)$cl['n'] . ')');
  $b .= '<p style="margin:4px 0">' . (int)$cl['n'] . ' fiche(s) cliente(s) aujourd\'hui' . (!empty($cl['sent']) ? ' · ' . (int)$cl['sent'] . ' programme(s) envoyé(s) sur WhatsApp' : '') . (!empty($cl['depense']) ? ' · dépense enregistrée : ' . number_format($cl['depense'], 0, ',', ' ') . ' DH' : '') . '.</p>';
  if (empty($cl['rows'])) $b .= '<p style="color:#6B5B50;margin:4px 0">Aucune cliente renseignée.</p>';
  foreach ($cl['rows'] as $r) {
    $bad = in_array($r['type'], ['Réclamation', 'Incident']);
    $col = $bad ? $C['urg'][1] : ($r['type'] ? $C['ok'][1] : '#D9C9BC');
    $pg = implode('  →  ', array_map(fn($s) => trim(hm($s['time']) . ' ' . $s['act']) . ($s['ok'] ? ' ✓' : ''), $r['steps']));
    $meta = implode(' · ', array_filter([$r['h'] ? 'arrivée ' . hm($r['h']) : '', $r['dep'] ? 'départ ' . hm($r['dep']) : '', $r['venue'] ? mb_strtolower($r['venue']) : '', $r['montant'] !== null ? number_format($r['montant'], 0, ',', ' ') . ' DH' : '']));
    $b .= card($col, '<b>' . ($r['bracelet'] ? 'N° ' . e($r['bracelet']) . ' — ' : '') . e($r['nom']) . '</b> ' . pill($r['statut'], $C[strpos($r['statut'], 'Envoyé') === 0 ? 'ok' : ''][0], $C[strpos($r['statut'], 'Envoyé') === 0 ? 'ok' : ''][1])
        . ($meta ? '<br><span style="color:#6B5B50;font-size:12.5px">' . e($meta) . '</span>' : '') . ($pg ? '<br>' . e($pg) : '<br><i style="color:#6B5B50">parcours à construire</i>')
        . ($r['type'] ? '<br>' . pill($r['type'], $bad ? $C['urg'][0] : $C['ok'][0], $bad ? $C['urg'][1] : $C['ok'][1]) . ' ' . e($r['motif']) . ($r['rep'] ? ' — réponse : ' . e($r['rep']) : '') . ' <span style="color:#6B5B50">· ' . ($r['traite'] ? 'traité' : 'à traiter') . '</span>' : ''));
  }

  /* --- messages envoyés --- */
  $b .= h2('Messages envoyés (' . count($R['messages']) . ')');
  if (!$R['messages']) $b .= '<p style="color:#6B5B50;margin:4px 0">Aucun envoi consigné.</p>';
  foreach ($R['messages'] as $m) {
    $b .= card($C['ok'][1], '<b>' . e($m['nom']) . '</b> <span style="color:#6B5B50">· ' . e($m['canal']) . ' · ' . e(hm($m['sentAt'])) . ($m['tel'] ? ' · ' . e($m['tel']) : '') . '</span><div style="margin-top:6px;padding:8px 10px;background:#F4ECE6;border-radius:6px;font-size:13px;white-space:pre-wrap">' . e($m['body']) . '</div>');
  }

  /* --- bilan / priorités --- */
  $b .= h2('Bilan / priorités du lendemain');
  $b .= ($R['bilan']['note'] ?? '') !== '' ? '<p style="margin:4px 0;white-space:pre-wrap">' . e($R['bilan']['note']) . '</p>' : '<p style="color:#6B5B50;margin:4px 0">Non renseigné.</p>';

  if (!empty($R['updatedAt'])) $b .= '<p style="color:#8B7B70;font-size:12px;margin-top:22px">Dernière saisie dans l\'application : ' . e(date('H\hi', strtotime($R['updatedAt']))) . '.</p>';
}

$html = '<!doctype html><html lang="fr"><body style="margin:0;background:#F4ECE6;font-family:Helvetica,Arial,sans-serif;color:#2B211C;line-height:1.45">'
  . '<div style="max-width:620px;margin:0 auto;padding:18px"><div style="background:#93412A;color:#fff;border-radius:14px 14px 0 0;padding:20px 22px"><div style="font:600 12px Helvetica,Arial,sans-serif;letter-spacing:.14em;opacity:.85">AVA BAY · MARRAKECH</div><div style="font:600 22px Georgia,serif;margin-top:4px">' . e($title) . '</div></div>'
  . '<div style="background:#fff;border-radius:0 0 14px 14px;padding:6px 22px 22px">' . $b
  . '<p style="margin:26px 0 0"><a href="' . $LINK . '" style="display:inline-block;background:#3E2B22;color:#fff;text-decoration:none;padding:11px 18px;border-radius:99px;font-weight:bold;font-size:14px">Ouvrir l\'application</a></p></div>'
  . '<p style="color:#8B7B70;font-size:12px;text-align:center;margin:14px 0">Message automatique envoyé à 11h et 20h par AVA Bay Pilotage.</p></div></body></html>';

if ($mode === 'dry') { echo $html; exit(0); }

$subject = '=?UTF-8?B?' . base64_encode('AVA Bay — ' . $title) . '?=';
$headers = "From: AVA Bay Pilotage <$FROM>\r\nReply-To: $FROM\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\nX-Auto-Response-Suppress: All\r\nAuto-Submitted: auto-generated";
$body = chunk_split(base64_encode($html));
$ok = 0;
foreach ($TO as $to) { if (@mail($to, $subject, $body, $headers, '-f' . $FROM)) $ok++; }
if ($ok) file_put_contents($marker, date('c') . " $ok/" . count($TO) . "\n");
echo "$title : $ok/" . count($TO) . " envoyé(s)\n";
