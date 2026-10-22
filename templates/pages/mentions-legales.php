<h1>Mentions légales</h1>

<h2>Éditeur du site</h2>
<p>
    Ce site est le portfolio personnel de <?= e($profile['nom'] ?? '') ?>, étudiant en BTS SIO option SISR.
    Il est réalisé dans le cadre de la formation et n'a pas de but commercial.
    <?php if (!empty($profile['email'])): ?>
        <br>Contact : <a href="mailto:<?= e($profile['email']) ?>"><?= e($profile['email']) ?></a>
    <?php endif; ?>
</p>
<p>Directeur de la publication : <?= e($profile['nom'] ?? '') ?>.</p>

<h2>Hébergement</h2>
<?php if (!empty($config['host'])): ?>
    <p><?= nl2br(e($config['host'])) ?></p>
<?php else: ?>
    <p>GitHub Pages, service de GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (<a href="https://pages.github.com/" rel="noopener">pages.github.com</a>).</p>
<?php endif; ?>

<h2>Données personnelles et cookies</h2>
<p>
    Ce site ne collecte aucune donnée personnelle : il n'a pas de formulaire, pas de mesure d'audience et ne dépose aucun cookie.
    Les réglages d'accessibilité choisis (taille du texte, contraste…) sont enregistrés uniquement dans votre navigateur et ne sont envoyés nulle part.
</p>
<p>L'hébergeur peut conserver des journaux techniques de connexion (adresse IP, date), comme tout serveur web.</p>

<h2>Propriété intellectuelle et crédits</h2>
<p>
    Les textes et illustrations (planètes, vaisseau, Radiant) sont des créations originales.
    Les univers évoqués (<i>Fondation</i> d'Isaac Asimov, <i>Death Stranding</i>, <i>Matrix</i>) sont cités comme inspiration et restent la propriété de leurs auteurs ; aucun visuel officiel n'est reproduit.
</p>
<p>Le code source du site est publié sous licence MIT<?php if (!empty($profile['github'])): ?> sur <a href="<?= e($profile['github']) ?>" rel="noopener">GitHub</a><?php endif; ?>.</p>

<h2>Accessibilité</h2>
<p>Le site vise le respect du RGAA : textes alternatifs, contrastes suffisants, navigation complète au clavier et panneau de réglages d'accessibilité en haut de chaque page.</p>
