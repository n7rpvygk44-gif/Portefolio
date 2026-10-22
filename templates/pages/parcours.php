<h1>Parcours</h1>

<?= Markdown::toHtml($profile['parcours'] ?? '') ?>

<?php if (!empty($profile['cv'])): ?>
    <p><a class="button" href="<?= e($profile['cv']) ?>" download>Télécharger mon CV (PDF)</a></p>
<?php endif; ?>
