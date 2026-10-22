<?php
// Convertisseur Markdown minimal pour les fiches de la base de connaissances.
// Gère : titres (##, ###), paragraphes, listes, blocs de code, `code`, **gras**, *italique*, [liens](url).
// Le texte est échappé avant toute mise en forme, donc aucun HTML saisi n'est exécuté.

declare(strict_types=1);

final class Markdown
{
    public static function toHtml(string $text): string
    {
        $lines = preg_split('/\R/', $text);
        $html = '';
        $paragraph = [];
        $list = null;
        $inCode = false;
        $code = [];

        $flushParagraph = function () use (&$paragraph, &$html) {
            if ($paragraph) {
                $html .= '<p>' . self::inline(implode(' ', $paragraph)) . "</p>\n";
                $paragraph = [];
            }
        };
        $closeList = function () use (&$list, &$html) {
            if ($list) {
                $html .= "</$list>\n";
                $list = null;
            }
        };

        foreach ($lines as $line) {
            if (str_starts_with(trim($line), '```')) {
                if ($inCode) {
                    $html .= '<pre><code>' . e(implode("\n", $code)) . "</code></pre>\n";
                    $code = [];
                    $inCode = false;
                } else {
                    $flushParagraph();
                    $closeList();
                    $inCode = true;
                }
                continue;
            }
            if ($inCode) {
                $code[] = $line;
                continue;
            }

            $trim = trim($line);
            if ($trim === '') {
                $flushParagraph();
                $closeList();
            } elseif (preg_match('/^(#{2,4})\s+(.*)$/', $trim, $m)) {
                $flushParagraph();
                $closeList();
                $level = strlen($m[1]);
                $html .= "<h$level>" . self::inline($m[2]) . "</h$level>\n";
            } elseif (preg_match('/^([-*]|\d+\.)\s+(.*)$/', $trim, $m)) {
                $flushParagraph();
                $type = ctype_digit($m[1][0]) ? 'ol' : 'ul';
                if ($list !== $type) {
                    $closeList();
                    $html .= "<$type>\n";
                    $list = $type;
                }
                $html .= '<li>' . self::inline($m[2]) . "</li>\n";
            } else {
                $closeList();
                $paragraph[] = $trim;
            }
        }
        if ($inCode) {
            $html .= '<pre><code>' . e(implode("\n", $code)) . "</code></pre>\n";
        }
        $flushParagraph();
        $closeList();
        return $html;
    }

    private static function inline(string $text): string
    {
        $text = e($text);
        $text = preg_replace('/`([^`]+)`/', '<code>$1</code>', $text);
        $text = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $text);
        $text = preg_replace('/\*(.+?)\*/', '<em>$1</em>', $text);
        // Liens : seulement http(s), mailto ou liens internes, pour éviter javascript:...
        return preg_replace_callback('/\[([^\]]+)\]\(([^)\s]+)\)/', function ($m) {
            $url = html_entity_decode($m[2], ENT_QUOTES);
            if (!preg_match('#^(https?://|mailto:|/)#', $url)) {
                return $m[1];
            }
            return '<a href="' . e($url) . '">' . $m[1] . '</a>';
        }, $text);
    }
}
