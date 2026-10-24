<h1>Supervision</h1>
<p class="lead">Ce que ce site consomme dans votre navigateur, mesuré et animé en temps réel, comme sur une console de supervision réseau.</p>
<p class="supervision-note">Toutes les mesures sont faites sur votre appareil et ne quittent jamais votre navigateur : rien n'est envoyé ni enregistré ailleurs. Certaines mesures n'existent que dans certains navigateurs ; elles sont alors signalées comme indisponibles.</p>

<div class="supervision" id="supervision">
    <section class="sv-panel sv-wide" aria-labelledby="sv-flux-titre">
        <h2 id="sv-flux-titre">Flux de données</h2>
        <p class="sv-help">Chaque particule est un fichier reçu pour afficher cette page : du serveur, ou du cache du navigateur quand il était déjà téléchargé. Les allers-retours réguliers sont les mesures de latence.</p>
        <canvas class="sv-canvas" data-chart="flux" data-ratio="0.3" aria-hidden="true"></canvas>
        <dl class="sv-stats">
            <div><dt>Requêtes</dt><dd data-out="requests">…</dd></div>
            <div><dt>Transférés sur le réseau</dt><dd data-out="transfer">…</dd></div>
            <div><dt>Taille réelle des fichiers</dt><dd data-out="decoded">…</dd></div>
            <div><dt>Gain de compression</dt><dd data-out="compression">…</dd></div>
            <div><dt>Servis par le cache</dt><dd data-out="cached">…</dd></div>
        </dl>
    </section>

    <section class="sv-panel" aria-labelledby="sv-types-titre">
        <h2 id="sv-types-titre">Répartition par type</h2>
        <p class="sv-help">Poids de chaque famille de fichiers dans la page.</p>
        <canvas class="sv-canvas" data-chart="types" data-ratio="0.62" aria-hidden="true"></canvas>
        <ul class="sv-legend" data-out="types"></ul>
    </section>

    <section class="sv-panel" aria-labelledby="sv-chrono-titre">
        <h2 id="sv-chrono-titre">Chronologie du chargement</h2>
        <p class="sv-help">Les étapes réseau et navigateur, de la demande de la page à son affichage complet.</p>
        <canvas class="sv-canvas" data-chart="chrono" data-ratio="0.62" aria-hidden="true"></canvas>
        <ul class="sv-legend" data-out="chrono"></ul>
    </section>

    <section class="sv-panel" aria-labelledby="sv-ping-titre">
        <h2 id="sv-ping-titre">Latence vers le serveur</h2>
        <p class="sv-help">Un petit fichier est demandé au serveur toutes les deux secondes, sans cache, comme un ping.</p>
        <canvas class="sv-canvas" data-chart="ping" data-ratio="0.5" aria-hidden="true"></canvas>
        <dl class="sv-stats">
            <div><dt>Dernière</dt><dd data-out="ping-last">…</dd></div>
            <div><dt>Moyenne</dt><dd data-out="ping-avg">…</dd></div>
            <div><dt>Gigue</dt><dd data-out="ping-jitter">…</dd></div>
            <div><dt>Pertes</dt><dd data-out="ping-loss">…</dd></div>
        </dl>
    </section>

    <section class="sv-panel" aria-labelledby="sv-pouls-titre">
        <h2 id="sv-pouls-titre">Pouls du navigateur</h2>
        <p class="sv-help">Images affichées par seconde (60 = parfaitement fluide) et tâches qui bloquent la page plus de 50 ms.</p>
        <canvas class="sv-canvas" data-chart="fps" data-ratio="0.5" aria-hidden="true"></canvas>
        <dl class="sv-stats">
            <div><dt>Images/seconde</dt><dd data-out="fps">…</dd></div>
            <div><dt>Tâches longues</dt><dd data-out="longtasks">…</dd></div>
            <div><dt>Mémoire JavaScript</dt><dd data-out="memory">…</dd></div>
        </dl>
    </section>

    <section class="sv-panel sv-wide" aria-labelledby="sv-vitaux-titre">
        <h2 id="sv-vitaux-titre">Signaux vitaux de la page</h2>
        <p class="sv-help">Les indicateurs de qualité utilisés par Google (Core Web Vitals) : vert = bon, orange = à améliorer, rouge = mauvais.</p>
        <canvas class="sv-canvas" data-chart="vitals" data-ratio="0.24" data-ratio-narrow="0.8" aria-hidden="true"></canvas>
        <ul class="sv-legend" data-out="vitals"></ul>
    </section>

    <section class="sv-panel sv-wide" aria-labelledby="sv-visite-titre">
        <h2 id="sv-visite-titre">Bilan de votre visite</h2>
        <p class="sv-help">Données reçues sur chaque page consultée depuis votre arrivée (conservé dans cet onglet uniquement).</p>
        <canvas class="sv-canvas" data-chart="visit" data-ratio="0.26" aria-hidden="true"></canvas>
        <dl class="sv-stats">
            <div><dt>Pages vues</dt><dd data-out="visit-pages">…</dd></div>
            <div><dt>Total reçu</dt><dd data-out="visit-total">…</dd></div>
            <div><dt>Part venue du cache</dt><dd data-out="visit-cache">…</dd></div>
            <div><dt>Connexion</dt><dd data-out="network">…</dd></div>
            <div><dt>Stockage utilisé</dt><dd data-out="storage">…</dd></div>
        </dl>
    </section>
</div>
<noscript><p class="empty">La supervision a besoin de JavaScript pour mesurer la page.</p></noscript>
