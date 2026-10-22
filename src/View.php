<?php
// Affichage des gabarits (templates) et petites fonctions utiles.

declare(strict_types=1);

// Échappe un texte avant de l'afficher dans le HTML (protection contre le XSS).
function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// Adresse d'une page ou d'un fichier du site, avec le préfixe base_path.
// En version statique, les pages se terminent par "/" (chaque page est un dossier avec index.html).
function url(string $path): string
{
    global $config;
    return rtrim($config['base_path'], '/') . page_path($path);
}

function page_path(string $path): string
{
    global $config;
    if (empty($config['static_build'])) {
        return $path;
    }
    $parts = explode('?', $path, 2);
    $last = basename($parts[0]);
    if ($parts[0] !== '/' && !str_contains($last, '.')) {
        $parts[0] = rtrim($parts[0], '/') . '/';
    }
    return implode('?', $parts);
}

// Ancre d'une compétence dans la page Compétences (ex. B1.1 -> b1-1).
function competence_anchor(string $code): string
{
    return strtolower(str_replace('.', '-', $code));
}

final class View
{
    // Affiche templates/<template>.php à l'intérieur du gabarit général (layout).
    public static function render(string $template, array $vars = [], string $layout = 'layout'): void
    {
        $vars['content'] = self::partial($template, $vars);
        echo self::partial($layout, $vars);
    }

    public static function partial(string $template, array $vars = []): string
    {
        extract($vars, EXTR_SKIP);
        ob_start();
        require ROOT_DIR . '/templates/' . $template . '.php';
        return (string) ob_get_clean();
    }
}
