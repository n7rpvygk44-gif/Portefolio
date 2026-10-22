<h1>Tableau de bord</h1>
<p>Connecté en tant que <strong><?= e($_SESSION['admin']) ?></strong>.</p>

<ul class="cards">
    <li class="card">
        <h2><a href="/admin/profil">Profil</a></h2>
        <p>Nom, accroche, parcours, liens de contact, sujet de veille.</p>
    </li>
    <li class="card">
        <h2><a href="/admin/apparence">Apparence</a></h2>
        <p>Choisir et prévisualiser le thème graphique du site.</p>
    </li>
    <?php foreach ($collections as $key => $c): ?>
        <li class="card">
            <h2><a href="/admin/<?= e($key) ?>"><?= e($c['label']) ?></a></h2>
            <p><?= $counts[$key] ?> élément(s)</p>
            <p><a href="/admin/<?= e($key) ?>/edit">+ Ajouter</a></p>
        </li>
    <?php endforeach; ?>
</ul>
