<?php
$titles = array_column($competences, 'titre', 'code');
?>
<p class="breadcrumb"><a href="/realisations">Réalisations</a> › <?= e($item['titre']) ?></p>

<article>
    <h1><?= e($item['titre']) ?></h1>
    <p class="meta"><?= e(implode(' · ', array_filter([$item['contexte'] ?? '', $item['date'] ?? '']))) ?></p>
    <p class="lead"><?= e($item['resume'] ?? '') ?></p>

    <div class="facts">
        <?php if (!empty($item['competences'])): ?>
            <div>
                <h2>Compétences mobilisées</h2>
                <ul>
                    <?php foreach ($item['competences'] as $code): ?>
                        <li><span class="code"><?= e($code) ?></span> <?= e($titles[$code] ?? '') ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        <?php if (!empty($item['outils'])): ?>
            <div>
                <h2>Outils</h2>
                <ul class="tags">
                    <?php foreach ($item['outils'] as $tool): ?>
                        <li><?= e($tool) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
    </div>

    <?= Markdown::toHtml($item['contenu'] ?? '') ?>

    <?php if ($kb): ?>
        <aside class="related">
            <h2>Documentation associée</h2>
            <ul>
                <?php foreach ($kb as $k): ?>
                    <li><a href="/base-de-connaissances/<?= e($k['slug']) ?>"><?= e($k['titre']) ?></a></li>
                <?php endforeach; ?>
            </ul>
        </aside>
    <?php endif; ?>
</article>
