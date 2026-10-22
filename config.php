<?php
// Configuration générale du site. À adapter avant la mise en ligne.
return [
    // URL publique du site, sans slash final (sert au référencement : canonical, sitemap).
    'base_url' => 'https://votre-compte.alwaysdata.net',
    'site_name' => 'Portfolio BTS SIO SISR',
    'lang' => 'fr',

    // Préfixe des liens quand le site n'est pas à la racine du domaine (ex. '/Portefolio').
    'base_path' => '',

    // Backoffice : false le désactive complètement (/admin renvoie une page introuvable).
    // Le code est conservé ; passer à true une fois le site hébergé avec PHP (AlwaysData).
    'admin_enabled' => false,

    // Réglages utilisés pour générer la version statique (bin/build-static.php, GitHub Pages).
    'static' => [
        'base_url' => 'https://n7rpvygk44-gif.github.io/Portefolio',
        'base_path' => '/Portefolio',
    ],

    // Dossier des données JSON (hors de public/, donc inaccessible depuis le web).
    'data_dir' => __DIR__ . '/data',

    // Sécurité du backoffice.
    'login_max_attempts' => 5,        // tentatives avant blocage
    'login_lock_seconds' => 15 * 60,  // durée du blocage
    'session_lifetime' => 30 * 60,    // déconnexion après 30 min d'inactivité
];
