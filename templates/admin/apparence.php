<h1>Apparence</h1>
<p>Choisissez le thème graphique du site. « Aperçu » ouvre le site avec ce thème, visible par vous seul, sans changer le thème publié.</p>

<?php if ($saved): ?>
    <p class="alert success" role="status">Thème enregistré.</p>
<?php endif; ?>

<form method="post" action="/admin/apparence" class="admin-form">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <fieldset>
        <legend>Thème du site</legend>
        <?php foreach ($themes as $name => $label): ?>
            <p class="theme-choice">
                <input type="radio" id="t-<?= e($name) ?>" name="theme" value="<?= e($name) ?>"<?= $name === $current ? ' checked' : '' ?>>
                <label for="t-<?= e($name) ?>"><?= e($label) ?></label>
                <a href="/?apercu=<?= e(rawurlencode($name)) ?>" target="_blank" rel="noopener">Aperçu</a>
            </p>
        <?php endforeach; ?>
    </fieldset>
    <button type="submit">Publier ce thème</button>
</form>

<p class="meta">Pour créer un nouveau thème : ajoutez un fichier <code>public/assets/css/themes/&lt;nom&gt;.css</code> (et, si besoin, <code>public/assets/js/themes/&lt;nom&gt;.js</code>). Il apparaîtra automatiquement ici.</p>
