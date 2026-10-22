<?php
// Affiche une page du site comme le ferait le serveur web (utilisé par build-static.php).
// Usage : STATIC_BUILD=1 php bin/render-page.php /parcours

$_SERVER['REQUEST_URI'] = $argv[1] ?? '/';
$_SERVER['REQUEST_METHOD'] = 'GET';
require __DIR__ . '/../public/index.php';
