<h1>Parcours</h1>

<?php if (!empty($profile['photo'])): ?>
    <img class="portrait" src="<?= e(str_starts_with($profile['photo'], '/') ? url($profile['photo']) : $profile['photo']) ?>" alt="Photo de <?= e($profile['nom'] ?? '') ?>" width="160" height="160">
<?php endif; ?>

<?= Markdown::toHtml($profile['parcours'] ?? '') ?>

<?php if (!empty($profile['cv'])): ?>
    <p><a class="button" href="<?= e(str_starts_with($profile['cv'], '/') ? url($profile['cv']) : $profile['cv']) ?>" download>Télécharger mon CV (PDF)</a></p>
<?php endif; ?>
