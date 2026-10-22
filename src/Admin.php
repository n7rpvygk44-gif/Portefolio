<?php
// Description des contenus modifiables depuis le backoffice.
// Ajouter un champ ici suffit pour qu'il apparaisse dans le formulaire.

declare(strict_types=1);

final class Admin
{
    public const COLLECTIONS = [
        'realisations' => [
            'label' => 'Réalisations',
            'public' => '/realisations/',
            'fields' => [
                'titre' => ['label' => 'Titre', 'type' => 'text', 'required' => true],
                'slug' => ['label' => 'Adresse (slug)', 'type' => 'text', 'help' => 'Laisser vide pour la générer depuis le titre.'],
                'contexte' => ['label' => 'Contexte', 'type' => 'select', 'options' => ['Formation', 'Stage', 'Personnel']],
                'date' => ['label' => 'Date', 'type' => 'date'],
                'resume' => ['label' => 'Résumé (aussi utilisé pour le référencement)', 'type' => 'textarea'],
                'competences' => ['label' => 'Compétences (codes séparés par des virgules, ex. B1.1, B1.4)', 'type' => 'list'],
                'outils' => ['label' => 'Outils (séparés par des virgules)', 'type' => 'list'],
                'kb' => ['label' => 'Fiches liées de la base de connaissances (slugs séparés par des virgules)', 'type' => 'list'],
                'contenu' => ['label' => 'Contenu (Markdown)', 'type' => 'markdown'],
            ],
        ],
        'kb' => [
            'label' => 'Base de connaissances',
            'public' => '/base-de-connaissances/',
            'fields' => [
                'titre' => ['label' => 'Titre', 'type' => 'text', 'required' => true],
                'slug' => ['label' => 'Adresse (slug)', 'type' => 'text', 'help' => 'Laisser vide pour la générer depuis le titre.'],
                'categorie' => ['label' => 'Catégorie', 'type' => 'select', 'options' => ['Guide', 'Documentation', 'Procédure', 'Mémo']],
                'outil' => ['label' => 'Outil concerné', 'type' => 'text'],
                'resume' => ['label' => 'Résumé', 'type' => 'textarea'],
                'contenu' => ['label' => 'Contenu (Markdown)', 'type' => 'markdown'],
            ],
        ],
        'veille' => [
            'label' => 'Veille technologique',
            'public' => '/veille/',
            'fields' => [
                'titre' => ['label' => 'Titre', 'type' => 'text', 'required' => true],
                'slug' => ['label' => 'Adresse (slug)', 'type' => 'text', 'help' => 'Laisser vide pour la générer depuis le titre.'],
                'date' => ['label' => 'Date', 'type' => 'date'],
                'source' => ['label' => 'Source', 'type' => 'text'],
                'url' => ['label' => 'Lien de la source', 'type' => 'text'],
                'resume' => ['label' => 'Résumé', 'type' => 'textarea'],
                'contenu' => ['label' => 'Analyse (Markdown)', 'type' => 'markdown'],
            ],
        ],
    ];

    public const PROFILE_FIELDS = [
        'nom' => ['label' => 'Nom complet', 'type' => 'text', 'required' => true],
        'titre' => ['label' => 'Titre', 'type' => 'text'],
        'accroche' => ['label' => 'Accroche (page d\'accueil)', 'type' => 'textarea'],
        'objectif' => ['label' => 'Objectif professionnel', 'type' => 'textarea'],
        'email' => ['label' => 'Adresse e-mail', 'type' => 'text'],
        'linkedin' => ['label' => 'Lien LinkedIn', 'type' => 'text'],
        'github' => ['label' => 'Lien GitHub', 'type' => 'text'],
        'cv' => ['label' => 'Chemin du CV (ex. /assets/cv.pdf)', 'type' => 'text'],
        'parcours' => ['label' => 'Parcours (Markdown)', 'type' => 'markdown'],
        'sujet_veille' => ['label' => 'Sujet de veille', 'type' => 'textarea'],
    ];

    // Construit un élément à partir des données envoyées par le formulaire.
    public static function fromPost(array $fields, array $post): array
    {
        $item = [];
        foreach ($fields as $name => $field) {
            $value = trim((string) ($post[$name] ?? ''));
            if ($field['type'] === 'list') {
                $value = array_values(array_filter(array_map('trim', explode(',', $value)), 'strlen'));
            } elseif ($field['type'] === 'select' && !in_array($value, $field['options'], true)) {
                $value = $field['options'][0];
            }
            $item[$name] = $value;
        }
        return $item;
    }

    public static function slugify(string $text): string
    {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
        $text = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $text));
        return trim($text, '-') ?: 'element';
    }
}
