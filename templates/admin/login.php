<section class="login">
    <h1>Connexion au backoffice</h1>
    <?php if ($error): ?>
        <p class="alert error" role="alert"><?= e($error) ?></p>
    <?php endif; ?>
    <form method="post" action="/admin/login">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <p>
            <label for="username">Identifiant</label>
            <input id="username" name="username" type="text" autocomplete="username" required>
        </p>
        <p>
            <label for="password">Mot de passe</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required>
        </p>
        <button type="submit">Se connecter</button>
    </form>
</section>
