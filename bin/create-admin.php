<?php
// Crée ou remplace le compte administrateur du backoffice.
// À lancer en ligne de commande : php bin/create-admin.php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit('À lancer en ligne de commande uniquement.');
}

require dirname(__DIR__) . '/src/JsonStore.php';
$config = require dirname(__DIR__) . '/config.php';
$store = new JsonStore($config['data_dir']);

$username = trim((string) readline('Identifiant : '));

// Saisie du mot de passe sans l'afficher à l'écran.
echo 'Mot de passe (12 caractères minimum) : ';
system('stty -echo 2>/dev/null');
$password = trim((string) fgets(STDIN));
system('stty echo 2>/dev/null');
echo PHP_EOL;

if ($username === '' || strlen($password) < 12) {
    exit("Identifiant vide ou mot de passe trop court.\n");
}

$store->write('admin', [
    'username' => $username,
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
]);
@chmod($config['data_dir'] . '/admin.json', 0600);

echo "Compte administrateur enregistré.\n";
