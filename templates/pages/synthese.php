<h1>Tableau de synthèse E5</h1>
<p class="lead">Ce tableau est généré automatiquement à partir des réalisations et des compétences qui leur sont associées. Il pourra être imprimé ou enregistré en PDF depuis le navigateur.</p>

<?php if (!$realisations): ?>
    <p class="empty">Le tableau se remplira dès la première réalisation publiée.</p>
<?php else: ?>
    <div class="table-wrap">
        <table class="synthese">
            <caption>Réalisations et compétences du bloc 1 mobilisées</caption>
            <thead>
                <tr>
                    <th scope="col">Réalisation</th>
                    <th scope="col">Contexte</th>
                    <th scope="col">Période</th>
                    <?php foreach ($competences as $c): ?>
                        <th scope="col"><abbr title="<?= e($c['titre']) ?>"><?= e($c['code']) ?></abbr></th>
                    <?php endforeach; ?>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($realisations as $r): ?>
                    <tr>
                        <th scope="row"><a href="/realisations/<?= e($r['slug']) ?>"><?= e($r['titre']) ?></a></th>
                        <td><?= e($r['contexte'] ?? '') ?></td>
                        <td><?= e($r['date'] ?? '') ?></td>
                        <?php foreach ($competences as $c): ?>
                            <td class="check"><?= in_array($c['code'], $r['competences'] ?? [], true) ? '<span aria-label="oui">✔</span>' : '<span class="visually-hidden">non</span>' ?></td>
                        <?php endforeach; ?>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>

<h2>Légende</h2>
<dl class="legend">
    <?php foreach ($competences as $c): ?>
        <dt><?= e($c['code']) ?></dt>
        <dd><?= e($c['titre']) ?></dd>
    <?php endforeach; ?>
</dl>
