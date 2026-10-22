<section class="hero">
    <h1><?= e($profile['nom'] ?? '') ?></h1>
    <p class="subtitle"><?= e($profile['titre'] ?? '') ?></p>
    <p class="lead"><?= e($profile['accroche'] ?? '') ?></p>
    <p class="actions">
        <a class="button" href="<?= e(url('/realisations')) ?>">Voir mes réalisations</a>
        <a class="button secondary" href="<?= e(url('/contact')) ?>">Me contacter</a>
    </p>
</section>

<?php if (!empty($profile['objectif'])): ?>
<section>
    <h2>Mon objectif</h2>
    <p><?= e($profile['objectif']) ?></p>
</section>
<?php endif; ?>

<section>
    <h2>Dernières réalisations</h2>
    <?php if ($realisations): ?>
        <?= View::partial('partials/cards', ['items' => $realisations, 'base' => '/realisations/']) ?>
    <?php else: ?>
        <p class="empty">Les premières réalisations arrivent bientôt.</p>
    <?php endif; ?>
</section>

<script type="application/ld+json"><?= json_encode([
    '@context' => 'https://schema.org',
    '@type' => 'Person',
    'name' => $profile['nom'] ?? '',
    'jobTitle' => $profile['titre'] ?? '',
    'url' => $config['base_url'],
    'sameAs' => array_values(array_filter([$profile['linkedin'] ?? '', $profile['github'] ?? ''])),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
