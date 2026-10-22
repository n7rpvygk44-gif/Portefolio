<ul class="cards">
    <?php foreach ($items as $item): ?>
        <li class="card">
            <h3><a href="<?= e($base . $item['slug']) ?>"><?= e($item['titre']) ?></a></h3>
            <?php if (!empty($item['contexte']) || !empty($item['date']) || !empty($item['categorie'])): ?>
                <p class="meta"><?= e(implode(' · ', array_filter([$item['contexte'] ?? '', $item['categorie'] ?? '', $item['outil'] ?? '', $item['date'] ?? '']))) ?></p>
            <?php endif; ?>
            <p><?= e($item['resume'] ?? '') ?></p>
        </li>
    <?php endforeach; ?>
</ul>
