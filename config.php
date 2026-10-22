<?php
// Configuration générale du site. À adapter avant la mise en ligne.
return [
    // URL publique du site, sans slash final (sert au référencement : canonical, sitemap).
    'base_url' => 'https://votre-compte.alwaysdata.net',
    'site_name' => 'Portfolio BTS SIO SISR',
    'lang' => 'fr',

    // Dossier des données JSON (hors de public/, donc inaccessible depuis le web).
    'data_dir' => __DIR__ . '/data',

    // Sécurité du backoffice.
    'login_max_attempts' => 5,        // tentatives avant blocage
    'login_lock_seconds' => 15 * 60,  // durée du blocage
    'session_lifetime' => 30 * 60,    // déconnexion après 30 min d'inactivité
];
