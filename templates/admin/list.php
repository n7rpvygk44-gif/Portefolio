<h1><?= e($collection['label']) ?></h1>
<p><a class="button" href="/admin/<?= e($key) ?>/edit">+ Ajouter</a></p>

<?php if (!$items): ?>
    <p class="empty">Aucun élément pour le moment.</p>
<?php else: ?>
    <table class="admin-table">
        <thead>
            <tr><th scope="col">Titre</th><th scope="col">Adresse</th><th scope="col">Actions</th></tr>
        </thead>
        <tbody>
            <?php foreach ($items as $item): ?>
                <tr>
                    <th scope="row"><?= e($item['titre']) ?></th>
                    <td><a href="<?= e($collection['public'] . $item['slug']) ?>" target="_blank" rel="noopener"><?= e($item['slug']) ?></a></td>
                    <td class="actions">
                        <a href="/admin/<?= e($key) ?>/edit?slug=<?= e(rawurlencode($item['slug'])) ?>">Modifier</a>
                        <form method="post" action="/admin/<?= e($key) ?>/delete" data-confirm="Supprimer « <?= e($item['titre']) ?> » ?">
                            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                            <input type="hidden" name="slug" value="<?= e($item['slug']) ?>">
                            <button type="submit" class="link danger">Supprimer</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
