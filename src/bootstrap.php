<?php
// Point de départ commun : configuration, classes, session et en-têtes de sécurité.

declare(strict_types=1);

define('ROOT_DIR', dirname(__DIR__));

require ROOT_DIR . '/src/JsonStore.php';
require ROOT_DIR . '/src/View.php';
require ROOT_DIR . '/src/Markdown.php';
require ROOT_DIR . '/src/Seo.php';
require ROOT_DIR . '/src/Auth.php';
require ROOT_DIR . '/src/Admin.php';
require ROOT_DIR . '/src/Theme.php';

$config = require ROOT_DIR . '/config.php';

$store = new JsonStore($config['data_dir']);

// En-têtes de sécurité envoyés sur toutes les pages.
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");

// Session : cookie inaccessible au JavaScript, limité au site, sécurisé en HTTPS.
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_name('portfolio_session');
session_start();

$auth = new Auth($store, $config);
$theme = Theme::current($store);
