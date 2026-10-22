<p class="breadcrumb"><a href="<?= e($back[0]) ?>"><?= e($back[1]) ?></a> › <?= e($item['titre']) ?></p>

<article>
    <h1><?= e($item['titre']) ?></h1>
    <p class="meta"><?= e(implode(' · ', array_filter([$item['categorie'] ?? '', $item['outil'] ?? '', $item['date'] ?? '', $item['source'] ?? '']))) ?></p>
    <?php if (!empty($item['resume'])): ?>
        <p class="lead"><?= e($item['resume']) ?></p>
    <?php endif; ?>

    <?= Markdown::toHtml($item['contenu'] ?? '') ?>

    <?php if (!empty($item['url']) && preg_match('#^https?://#', $item['url'])): ?>
        <p><a href="<?= e($item['url']) ?>" rel="noopener">Lire la source</a></p>
    <?php endif; ?>
</article>
