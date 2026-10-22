<h1>Base de connaissances</h1>
<p class="lead">Guides d'utilisation, documentations et procédures des outils présentés dans mes réalisations.</p>

<form class="search" method="get" action="/base-de-connaissances" role="search">
    <label for="q">Rechercher une fiche</label>
    <input type="search" id="q" name="q" value="<?= e($q) ?>" placeholder="ex. VLAN, Active Directory, GLPI…" data-kb-filter>
    <button type="submit">Rechercher</button>
</form>

<?php
$byCategory = [];
foreach ($items as $item) {
    $byCategory[$item['categorie'] ?? 'Autre'][] = $item;
}
ksort($byCategory);
?>

<?php if (!$items): ?>
    <p class="empty"><?= $q !== '' ? 'Aucune fiche ne correspond à « ' . e($q) . ' ».' : 'Aucune fiche pour le moment.' ?></p>
<?php endif; ?>

<?php foreach ($byCategory as $category => $list): ?>
    <section class="kb-category" data-kb-section>
        <h2><?= e($category) ?></h2>
        <?= View::partial('partials/cards', ['items' => $list, 'base' => '/base-de-connaissances/']) ?>
    </section>
<?php endforeach; ?>
<p class="empty" data-kb-empty hidden>Aucune fiche ne correspond à cette recherche.</p>
