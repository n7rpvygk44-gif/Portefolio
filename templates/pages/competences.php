<h1>Compétences</h1>
<p class="lead">Les compétences du bloc 1 du référentiel BTS SIO (« Support et mise à disposition de services informatiques »), avec les réalisations qui les mettent en œuvre.</p>

<?php foreach ($competences as $c): ?>
    <?php $linked = array_filter($realisations, fn ($r) => in_array($c['code'], $r['competences'] ?? [], true)); ?>
    <section class="competence">
        <h2><span class="code"><?= e($c['code']) ?></span> <?= e($c['titre']) ?></h2>
        <ul>
            <?php foreach ($c['details'] as $d): ?>
                <li><?= e($d) ?></li>
            <?php endforeach; ?>
        </ul>
        <p class="meta">
            Réalisations :
            <?php if ($linked): ?>
                <?= implode(', ', array_map(fn ($r) => '<a href="/realisations/' . e($r['slug']) . '">' . e($r['titre']) . '</a>', $linked)) ?>
            <?php else: ?>
                à venir
            <?php endif; ?>
        </p>
    </section>
<?php endforeach; ?>
