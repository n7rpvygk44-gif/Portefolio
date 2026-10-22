<h1>Veille technologique</h1>

<?php if (!empty($profile['sujet_veille'])): ?>
    <p class="lead"><?= e($profile['sujet_veille']) ?></p>
<?php endif; ?>

<?php if ($articles): ?>
    <?= View::partial('partials/cards', ['items' => $articles, 'base' => '/veille/']) ?>
<?php else: ?>
    <p class="empty">Les premiers articles de veille arrivent bientôt.</p>
<?php endif; ?>
