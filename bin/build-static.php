<?php
// Génère la version statique du site dans dist/ (HTML, CSS, JS, sitemap.xml, robots.txt).
// Usage : php bin/build-static.php
// Le résultat peut être hébergé sans PHP (GitHub Pages). Le backoffice n'y est pas inclus.

declare(strict_types=1);

putenv('STATIC_BUILD=1');
require dirname(__DIR__) . '/src/bootstrap.php';

$out = ROOT_DIR . '/dist';

function removeDir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST) as $item) {
        $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }
    rmdir($dir);
}

function copyDir(string $from, string $to): void
{
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($from, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST) as $item) {
        $target = $to . substr($item->getPathname(), strlen($from));
        $item->isDir() ? @mkdir($target, 0755, true) : copy($item->getPathname(), $target);
    }
}

// Chaque page est rendue dans un processus PHP séparé, comme une vraie requête.
function render(string $path): string
{
    $cmd = 'STATIC_BUILD=1 ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(ROOT_DIR . '/bin/render-page.php') . ' ' . escapeshellarg($path);
    exec($cmd, $lines, $code);
    if ($code !== 0) {
        fwrite(STDERR, "Erreur sur $path\n" . implode("\n", $lines) . "\n");
        exit(1);
    }
    return implode("\n", $lines) . "\n";
}

function save(string $file, string $content): void
{
    @mkdir(dirname($file), 0755, true);
    file_put_contents($file, $content);
}

removeDir($out);
mkdir($out, 0755, true);

$pages = Seo::pages($store);
foreach ($pages as $path) {
    $file = $path === '/' ? '/index.html' : $path . '/index.html';
    save($out . $file, render($path));
}
save($out . '/404.html', render('/page-introuvable'));
save($out . '/sitemap.xml', render('/sitemap.xml'));
save($out . '/robots.txt', render('/robots.txt'));
copyDir(ROOT_DIR . '/public/assets', $out . '/assets');
// Les fichiers du backoffice ne servent pas dans la version statique.
@unlink($out . '/assets/css/admin.css');
@unlink($out . '/assets/js/admin.js');
// Indique à GitHub Pages de servir les fichiers tels quels (sans Jekyll).
touch($out . '/.nojekyll');

echo count($pages) . " pages générées dans dist/ pour " . $config['base_url'] . "\n";
