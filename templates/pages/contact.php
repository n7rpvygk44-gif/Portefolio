<h1>Contact</h1>
<p class="lead">Une question sur mon parcours ou une proposition de stage ? Écrivez-moi.</p>

<ul class="contact-list">
    <?php if (!empty($profile['email'])): ?>
        <li>E-mail : <a href="mailto:<?= e($profile['email']) ?>"><?= e($profile['email']) ?></a></li>
    <?php endif; ?>
    <?php if (!empty($profile['linkedin'])): ?>
        <li>LinkedIn : <a href="<?= e($profile['linkedin']) ?>" rel="noopener">mon profil</a></li>
    <?php endif; ?>
    <?php if (!empty($profile['github'])): ?>
        <li>GitHub : <a href="<?= e($profile['github']) ?>" rel="noopener">mes dépôts</a></li>
    <?php endif; ?>
</ul>
