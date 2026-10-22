<?php
// Thèmes graphiques interchangeables.
// Un thème = un fichier public/assets/css/themes/<nom>.css (et, en option, public/assets/js/themes/<nom>.js).
// "defaut" correspond au style de base seul (style.css).

declare(strict_types=1);

final class Theme
{
    public const DEFAULT = 'defaut';

    // Noms affichés dans le backoffice. Un thème non listé ici apparaît sous son nom de fichier.
    public const LABELS = [
        'defaut' => 'Sobre (par défaut)',
        'codec' => 'Codec : Metal Gear Solid × Matrix',
        'seldon' => 'Seldon : Metal Gear Solid × Matrix × Fondation',
        'fondation' => 'Fondation : clair, moderne et technique (planètes, vaisseau, Radiant HUD)',
        'fondation-classique' => 'Fondation classique : clair, titres à empattements',
        'fondation-nuit' => 'Fondation (nuit) : espace profond, touches Death Stranding 2 et Matrix',
    ];

    public static function available(): array
    {
        $themes = [self::DEFAULT => self::LABELS[self::DEFAULT]];
        foreach (glob(ROOT_DIR . '/public/assets/css/themes/*.css') ?: [] as $file) {
            $name = basename($file, '.css');
            $themes[$name] = self::LABELS[$name] ?? $name;
        }
        return $themes;
    }

    // Thème actif. Un administrateur connecté peut prévisualiser un autre thème :
    // ?apercu=<nom> l'active pour sa session seulement, ?apercu=fin revient au thème publié.
    public static function current(JsonStore $store): string
    {
        $themes = self::available();
        if (!empty($_SESSION['admin']) && isset($_GET['apercu'])) {
            $_SESSION['apercu'] = isset($themes[$_GET['apercu']]) ? (string) $_GET['apercu'] : null;
        }
        $preview = self::preview();
        if ($preview !== null && isset($themes[$preview])) {
            return $preview;
        }
        $theme = (string) ($store->read('settings')['theme'] ?? self::DEFAULT);
        return isset($themes[$theme]) ? $theme : self::DEFAULT;
    }

    public static function preview(): ?string
    {
        return !empty($_SESSION['admin']) ? ($_SESSION['apercu'] ?? null) : null;
    }

    public static function hasScript(string $theme): bool
    {
        return is_file(ROOT_DIR . '/public/assets/js/themes/' . $theme . '.js');
    }
}
