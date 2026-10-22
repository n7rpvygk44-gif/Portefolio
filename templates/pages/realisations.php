<h1>Réalisations</h1>
<p class="lead">Mes projets et situations professionnelles, en formation, en stage ou à titre personnel.</p>

<?php if ($realisations): ?>
    <?= View::partial('partials/cards', ['items' => $realisations, 'base' => '/realisations/']) ?>
<?php else: ?>
    <p class="empty">Aucune réalisation publiée pour le moment.</p>
<?php endif; ?>
