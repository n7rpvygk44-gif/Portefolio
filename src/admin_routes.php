<?php
// Routes du backoffice (/admin/...). Chargé par public/index.php.
// Toutes les pages sauf /admin/login demandent d'être connecté.

declare(strict_types=1);

header('X-Robots-Tag: noindex, nofollow');

$admin = fn (string $title, array $extra = []) => [
    'config' => $config,
    'title' => $title,
    'collections' => Admin::COLLECTIONS,
    'csrf' => Auth::csrfToken(),
] + $extra;

$redirect = function (string $to): never {
    header('Location: ' . $to, true, 303);
    exit;
};

// Connexion
if ($path === '/admin/login') {
    $error = null;
    if ($method === 'POST') {
        if (!Auth::checkCsrf()) {
            $error = 'Session expirée, veuillez réessayer.';
        } else {
            $error = $auth->login((string) ($_POST['username'] ?? ''), (string) ($_POST['password'] ?? ''));
            if ($error === null) {
                $redirect('/admin');
            }
        }
    }
    View::render('admin/login', $admin('Connexion', ['error' => $error]), 'admin/layout');
    return;
}

if (!$auth->check()) {
    $redirect('/admin/login');
}

// Toutes les actions qui modifient des données sont en POST avec jeton CSRF.
if ($method === 'POST' && !Auth::checkCsrf()) {
    http_response_code(400);
    exit('Jeton de sécurité invalide. Rechargez la page.');
}

if ($path === '/admin/logout' && $method === 'POST') {
    $auth->logout();
    $redirect('/admin/login');
}

if ($path === '/admin') {
    $counts = [];
    foreach (Admin::COLLECTIONS as $key => $_) {
        $counts[$key] = count($store->read($key));
    }
    View::render('admin/dashboard', $admin('Tableau de bord', ['counts' => $counts]), 'admin/layout');
    return;
}

if ($path === '/admin/profil') {
    $profile = $store->read('profile');
    $saved = false;
    if ($method === 'POST') {
        $profile = Admin::fromPost(Admin::PROFILE_FIELDS, $_POST);
        $store->write('profile', $profile);
        $saved = true;
    }
    View::render('admin/form', $admin('Profil', [
        'fields' => Admin::PROFILE_FIELDS,
        'item' => $profile,
        'action' => '/admin/profil',
        'saved' => $saved,
        'back' => '/admin',
    ]), 'admin/layout');
    return;
}

if ($path === '/admin/apparence') {
    $themes = Theme::available();
    $settings = $store->read('settings');
    $saved = false;
    if ($method === 'POST' && isset($themes[$_POST['theme'] ?? ''])) {
        $settings['theme'] = $_POST['theme'];
        $store->write('settings', $settings);
        $saved = true;
    }
    View::render('admin/apparence', $admin('Apparence', [
        'themes' => $themes,
        'current' => $settings['theme'] ?? Theme::DEFAULT,
        'saved' => $saved,
    ]), 'admin/layout');
    return;
}

if (!preg_match('#^/admin/([a-z]+)(?:/(edit|delete))?$#', $path, $m) || !isset(Admin::COLLECTIONS[$m[1]])) {
    http_response_code(404);
    exit('Page introuvable.');
}

$key = $m[1];
$action = $m[2] ?? 'list';
$collection = Admin::COLLECTIONS[$key];
$items = $store->read($key);

if ($action === 'list') {
    View::render('admin/list', $admin($collection['label'], ['key' => $key, 'collection' => $collection, 'items' => $items]), 'admin/layout');
    return;
}

if ($action === 'delete' && $method === 'POST') {
    $slug = (string) ($_POST['slug'] ?? '');
    $store->write($key, array_values(array_filter($items, fn ($i) => $i['slug'] !== $slug)));
    $redirect("/admin/$key");
}

if ($action === 'edit') {
    $original = (string) ($_GET['slug'] ?? '');
    $item = $original !== '' ? $store->find($key, $original) : [];
    $error = null;

    if ($method === 'POST') {
        $item = Admin::fromPost($collection['fields'], $_POST);
        $item['slug'] = Admin::slugify($item['slug'] !== '' ? $item['slug'] : $item['titre']);

        $taken = array_filter($items, fn ($i) => $i['slug'] === $item['slug'] && $i['slug'] !== $original);
        if ($item['titre'] === '') {
            $error = 'Le titre est obligatoire.';
        } elseif ($taken) {
            $error = 'Cette adresse (slug) est déjà utilisée.';
        } else {
            $replaced = false;
            foreach ($items as $i => $existing) {
                if ($existing['slug'] === $original && $original !== '') {
                    $items[$i] = $item;
                    $replaced = true;
                }
            }
            if (!$replaced) {
                $items[] = $item;
            }
            $store->write($key, $items);
            $redirect("/admin/$key");
        }
    }

    View::render('admin/form', $admin($collection['label'], [
        'fields' => $collection['fields'],
        'item' => $item ?? [],
        'action' => "/admin/$key/edit" . ($original !== '' ? '?slug=' . rawurlencode($original) : ''),
        'error' => $error,
        'back' => "/admin/$key",
    ]), 'admin/layout');
    return;
}

http_response_code(405);
exit('Action non autorisée.');
