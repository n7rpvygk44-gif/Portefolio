<h1>Compétences</h1>
<p class="lead">Les compétences du bloc 1 du référentiel BTS SIO (« Support et mise à disposition de services informatiques »), avec les réalisations qui les mettent en œuvre.</p>

<?php foreach ($competences as $c): ?>
    <?php $linked = array_filter($realisations, fn ($r) => in_array($c['code'], $r['competences'] ?? [], true)); ?>
    <section class="competence" id="<?= e(competence_anchor($c['code'])) ?>">
        <h2><span class="code"><?= e($c['code']) ?></span> <?= e($c['titre']) ?></h2>
        <ul>
            <?php foreach ($c['details'] as $d): ?>
                <li><?= e($d) ?></li>
            <?php endforeach; ?>
        </ul>
        <p class="meta">
            Réalisations :
            <?php if ($linked): ?>
                <?= implode(', ', array_map(fn ($r) => '<a href="' . e(url('/realisations/' . $r['slug'])) . '">' . e($r['titre']) . '</a>', $linked)) ?>
            <?php else: ?>
                à venir
            <?php endif; ?>
        </p>
    </section>
<?php endforeach; ?>

<h2 id="techniques">Compétences techniques</h2>
<p class="lead">Les technologies de l'option SISR que je travaille, avec mon niveau actuel. Ce tableau évolue au fil de la formation.</p>
<?php if (!$techniques): ?>
    <p class="empty">Les compétences techniques seront bientôt ajoutées.</p>
<?php else: ?>
    <div class="cards techniques">
        <?php foreach ($techniques as $domaine): ?>
            <section class="card">
                <h3><?= e($domaine['domaine']) ?></h3>
                <ul class="skill-list">
                    <?php foreach ($domaine['items'] as $item): ?>
                        <li><span><?= e($item['nom']) ?></span> <span class="meta"><?= e(($item['niveau'] ?? '') !== '' ? $item['niveau'] : 'niveau à évaluer') ?></span></li>
                    <?php endforeach; ?>
                </ul>
            </section>
        <?php endforeach; ?>
    </div>
    <p class="meta">Niveaux : notions, en cours d'acquisition, autonome, maîtrise.</p>
<?php endif; ?>
