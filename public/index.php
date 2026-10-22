<?php
// Contrôleur frontal : toutes les adresses du site arrivent ici (voir .htaccess)
// et sont dirigées vers la bonne page.

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

$path = '/' . trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$profile = $store->read('profile');

// Variables communes à toutes les pages publiques.
$page = fn (string $title, string $description) => [
    'config' => $config,
    'theme' => $theme,
    'profile' => $profile,
    'path' => $path,
    'title' => $title,
    'description' => $description,
    'canonical' => Seo::url($config, $path),
];

function notFound(array $vars): void
{
    http_response_code(404);
    View::render('pages/404', $vars);
}

// ----- Backoffice -----
if ($config['admin_enabled'] && ($path === '/admin' || str_starts_with($path, '/admin/'))) {
    require ROOT_DIR . '/src/admin_routes.php';
    exit;
}

// ----- Fichiers générés pour le référencement -----
if ($path === '/sitemap.xml') {
    header('Content-Type: application/xml; charset=utf-8');
    echo Seo::sitemap($config, $store);
    exit;
}
if ($path === '/robots.txt') {
    header('Content-Type: text/plain; charset=utf-8');
    echo Seo::robots($config);
    exit;
}

// ----- Pages publiques -----
$name = $profile['nom'] ?? '';

switch (true) {
    case $path === '/':
        View::render('pages/home', $page('Accueil', $profile['accroche'] ?? '') + [
            'realisations' => array_slice($store->read('realisations'), 0, 3),
        ]);
        break;

    case $path === '/parcours':
        View::render('pages/parcours', $page('Parcours', "Formation et parcours de $name."));
        break;

    case $path === '/competences':
        View::render('pages/competences', $page('Compétences', 'Compétences du référentiel BTS SIO SISR et réalisations associées.') + [
            'competences' => $store->read('competences'),
            'realisations' => $store->read('realisations'),
        ]);
        break;

    case $path === '/realisations':
        View::render('pages/realisations', $page('Réalisations', 'Projets et situations professionnelles réalisés en BTS SIO SISR.') + [
            'realisations' => $store->read('realisations'),
        ]);
        break;

    case (bool) preg_match('#^/realisations/([a-z0-9-]+)$#', $path, $m):
        $item = $store->find('realisations', $m[1]);
        if (!$item) {
            notFound($page('Page introuvable', ''));
            break;
        }
        $kb = array_values(array_filter($store->read('kb'), fn ($k) => in_array($k['slug'], $item['kb'] ?? [], true)));
        View::render('pages/realisation', $page($item['titre'], $item['resume'] ?? '') + [
            'item' => $item,
            'kb' => $kb,
            'competences' => $store->read('competences'),
        ]);
        break;

    case $path === '/synthese':
        View::render('pages/synthese', $page('Tableau de synthèse', 'Tableau de synthèse de l\'épreuve E5 : réalisations et compétences mobilisées.') + [
            'competences' => $store->read('competences'),
            'realisations' => $store->read('realisations'),
        ]);
        break;

    case $path === '/veille':
        View::render('pages/veille', $page('Veille technologique', $profile['sujet_veille'] ?? 'Veille technologique.') + [
            'articles' => $store->read('veille'),
        ]);
        break;

    case (bool) preg_match('#^/veille/([a-z0-9-]+)$#', $path, $m):
        $item = $store->find('veille', $m[1]);
        if (!$item) {
            notFound($page('Page introuvable', ''));
            break;
        }
        View::render('pages/article', $page($item['titre'], $item['resume'] ?? '') + [
            'item' => $item,
            'back' => ['/veille', 'Veille technologique'],
        ]);
        break;

    case $path === '/base-de-connaissances':
        $q = trim((string) ($_GET['q'] ?? ''));
        $items = $store->read('kb');
        if ($q !== '') {
            $items = array_values(array_filter($items, fn ($k) => mb_stripos(
                ($k['titre'] ?? '') . ' ' . ($k['outil'] ?? '') . ' ' . ($k['resume'] ?? '') . ' ' . ($k['contenu'] ?? ''),
                $q
            ) !== false));
        }
        View::render('pages/kb', $page('Base de connaissances', 'Guides, documentations et procédures des outils utilisés dans mes projets.') + [
            'items' => $items,
            'q' => $q,
        ]);
        break;

    case (bool) preg_match('#^/base-de-connaissances/([a-z0-9-]+)$#', $path, $m):
        $item = $store->find('kb', $m[1]);
        if (!$item) {
            notFound($page('Page introuvable', ''));
            break;
        }
        View::render('pages/article', $page($item['titre'], $item['resume'] ?? '') + [
            'item' => $item,
            'back' => ['/base-de-connaissances', 'Base de connaissances'],
        ]);
        break;

    case $path === '/contact':
        View::render('pages/contact', $page('Contact', "Contacter $name."));
        break;

    default:
        notFound($page('Page introuvable', ''));
}
