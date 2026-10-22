<?php
// Affichage des gabarits (templates) et petites fonctions utiles.

declare(strict_types=1);

// Échappe un texte avant de l'afficher dans le HTML (protection contre le XSS).
function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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
