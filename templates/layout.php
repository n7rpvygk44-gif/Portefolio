<?php
$siteName = $profile['nom'] ?? $config['site_name'];
$menu = [
    '/' => 'Accueil',
    '/parcours' => 'Parcours',
    '/competences' => 'Compétences',
    '/realisations' => 'Réalisations',
    '/synthese' => 'Synthèse E5',
    '/veille' => 'Veille',
    '/base-de-connaissances' => 'Base de connaissances',
    '/supervision' => 'Supervision',
    '/contact' => 'Contact',
];
$isCurrent = fn (string $href) => $href === '/' ? $path === '/' : str_starts_with($path, $href);
?>
<!DOCTYPE html>
<html lang="<?= e($config['lang']) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title) ?> | <?= e($siteName) ?></title>
    <meta name="description" content="<?= e($description) ?>">
    <link rel="canonical" href="<?= e($canonical) ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= e($title) ?>">
    <meta property="og:description" content="<?= e($description) ?>">
    <meta property="og:url" content="<?= e($canonical) ?>">
    <meta property="og:site_name" content="<?= e($siteName) ?>">
    <link rel="stylesheet" href="<?= e(asset('/assets/css/style.css')) ?>">
    <?php if ($theme !== Theme::DEFAULT): ?>
        <link rel="stylesheet" href="<?= e(asset('/assets/css/themes/' . $theme . '.css')) ?>">
    <?php endif; ?>
    <script src="<?= e(asset('/assets/js/main.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/js/sound.js')) ?>" defer></script>
    <script src="<?= e(asset('/assets/js/supervision.js')) ?>" defer></script>
    <?php if (Theme::hasScript($theme)): ?>
        <script src="<?= e(asset('/assets/js/themes/' . $theme . '.js')) ?>" defer></script>
    <?php endif; ?>
</head>
<body class="theme-<?= e($theme) ?>">
<a class="skip-link" href="#contenu">Aller au contenu</a>
<?php if (Theme::preview() !== null): ?>
    <p class="preview-banner">Aperçu du thème « <?= e(Theme::available()[$theme] ?? $theme) ?> » (visible par vous seul) · <a href="?apercu=fin">Quitter l'aperçu</a> · <a href="/admin/apparence">Apparence</a></p>
<?php endif; ?>

<header class="site-header">
    <div class="container header-inner">
        <a class="brand" href="<?= e(url('/')) ?>"><?= e($siteName) ?></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
        <nav id="menu" class="main-nav" aria-label="Menu principal">
            <ul>
                <?php foreach ($menu as $href => $label): ?>
                    <li><a href="<?= e(url($href)) ?>"<?= $isCurrent($href) ? ' aria-current="page"' : '' ?>><?= e($label) ?></a></li>
                <?php endforeach; ?>
            </ul>
        </nav>
    </div>
</header>

<?= View::partial('partials/accessibility') ?>

<main id="contenu" class="container" tabindex="-1">
    <?= $content ?>
</main>

<button class="sound-toggle" type="button" aria-pressed="false" title="Activer le son du site"><span class="sound-icon" aria-hidden="true"></span><span class="sound-label">Son coupé</span></button>

<footer class="site-footer">
    <div class="container">
        <p>© <?= date('Y') ?> <?= e($siteName) ?> · Portfolio BTS SIO option SISR · <a href="<?= e(url('/mentions-legales')) ?>">Mentions légales</a></p>
    </div>
</footer>
</body>
</html>
