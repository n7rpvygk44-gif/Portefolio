# Portfolio BTS SIO SISR

Site portfolio pour l'épreuve E5 du BTS SIO option SISR : présentation, parcours, compétences du bloc 1, réalisations, tableau de synthèse, veille technologique, base de connaissances et contact.

- **PHP natif** (8.1 ou plus), sans framework ni base de données
- **Données en JSON** dans `data/`, hors de la partie publique
- **Backoffice sécurisé** sur `/admin`
- **Référencement** : URL propres, balises meta et Open Graph, `sitemap.xml` et `robots.txt` générés
- **Accessibilité** : panneau de réglages (texte agrandi, contraste, lecture facilitée, animations), navigation au clavier
- **Thèmes interchangeables**, choisis depuis le backoffice
- **Ambiance sonore** (`public/assets/js/sound.js`) : sons synthétisés en direct (Web Audio API, aucun fichier audio), dans l'esprit des tableaux de bord épurés en verre et aluminium. Rituel de démarrage à l'activation, bande-son synchronisée avec l'introduction du Radiant, nappe d'ambiance, déclics et effleurements sur les liens et boutons, tintements quand le thème Fondation déploie l'interface. Coupé par défaut ; bouton rond en bas à gauche, choix mémorisé dans le navigateur.

## Organisation des fichiers

```
config.php                 configuration (adresse du site, sécurité)
public/                    racine web : seul dossier accessible depuis Internet
  index.php                contrôleur frontal (toutes les adresses passent par lui)
  .htaccess                URL propres (Apache)
  assets/css/style.css     style de base
  assets/css/themes/       un fichier CSS par thème
  assets/js/main.js        menu, accessibilité, filtre de la base de connaissances
  assets/js/themes/        script optionnel d'un thème
src/                       logique PHP (données JSON, authentification, SEO, Markdown, thèmes)
templates/                 gabarits HTML (pages publiques et backoffice)
data/                      contenus en JSON (profil, réalisations, veille, base de connaissances)
bin/create-admin.php       création du compte administrateur
bin/router.php             routeur pour tester en local
bin/build-static.php       génération de la version statique (dist/)
```

## Tester en local

```
php -S localhost:8000 -t public bin/router.php
```

Puis ouvrir http://localhost:8000. Pour tester le backoffice : passer `'admin_enabled'` à `true`, lancer `php bin/create-admin.php`, puis ouvrir http://localhost:8000/admin.

## Version statique (GitHub Pages) : mode actuel

Pour l'instant le site est publié **sans PHP** sur GitHub Pages : https://n7rpvygk44-gif.github.io/Portefolio/

- `php bin/build-static.php` génère toutes les pages en HTML dans `dist/` (avec `sitemap.xml` et `robots.txt`).
- La publication se lance **à la main** : sur GitHub, onglet **Actions › Publier sur GitHub Pages › Run workflow** (workflow `.github/workflows/pages.yml`). Un push seul ne change pas le site en ligne.
- Le contenu se modifie dans les fichiers `data/*.json`, puis on pousse sur GitHub et on publie quand c'est prêt.
- La recherche de la base de connaissances fonctionne en JavaScript.
- Le **backoffice est désactivé** (`'admin_enabled' => false` dans `config.php`) : son code est conservé, mais `/admin` renvoie une page introuvable et il n'est pas inclus dans la version statique.

Adresse et préfixe de la version statique : section `static` de `config.php`.

## Mettre en ligne sur AlwaysData (plus tard, avec le backoffice)

Passer `'admin_enabled'` à `true` dans `config.php`, puis :


1. Créer un compte gratuit sur alwaysdata.com.
2. **Web › Sites** : type PHP, racine du site = `www/public`.
3. Se connecter en SSH et cloner le dépôt dans `www` : `git clone https://github.com/<compte>/<depot>.git www`
4. `php www/bin/create-admin.php` pour créer le compte du backoffice.
5. Renseigner `base_url` dans `config.php`, puis décommenter la redirection HTTPS dans `public/.htaccess`.

Pour une mise à jour du code : `cd www && git pull`.

Les contenus saisis dans le backoffice sont écrits dans `data/` sur le serveur. Pensez à les récupérer régulièrement (SFTP) et à les committer, pour les sauvegarder et garder le dépôt à jour.

## Sécurité du backoffice

- Mot de passe haché avec `password_hash` (jamais stocké en clair), fichier `data/admin.json` exclu de Git
- Blocage après 5 échecs de connexion pendant 15 minutes
- Jeton CSRF sur tous les formulaires, actions de modification en POST uniquement
- Cookie de session `HttpOnly`, `SameSite=Strict`, `Secure` en HTTPS, nouvel identifiant à la connexion, expiration après 30 minutes d'inactivité
- Échappement de tout le contenu affiché (protection XSS), Markdown sans HTML brut
- En-têtes de sécurité (Content-Security-Policy, X-Frame-Options, nosniff), `data/` inaccessible depuis le web

## Thèmes

Un thème est un fichier `public/assets/css/themes/<nom>.css` qui surcharge `style.css` (et, en option, `public/assets/js/themes/<nom>.js`). Il apparaît automatiquement dans **Backoffice › Apparence**, où l'on peut le prévisualiser (visible par l'administrateur seul) avant de le publier.

Thèmes fournis :
- `defaut` : sobre, clair ou sombre
- `codec` : univers Metal Gear Solid (écran de codec, HUD) et Matrix (vert phosphore, pluie de caractères). La pluie se coupe avec « Réduire les animations » ou le contraste renforcé.
- `seldon` : `codec` + univers de *Fondation* d'Asimov (ciel galactique, Radiant de Hari Seldon, Terminus, Encyclopédie Galactique, symboles de psychohistoire dans la pluie).
- `fondation` (actif) : thème clair inspiré de l'esthétique de la série *Fondation* (Apple TV+) : ivoire, or et encre, titres en capitales espacées, Trantor seule dans le ciel. Le **Radiant** (losange d'obsidienne d'où se déploient des sphères d'équations en 3D) ouvre la visite par une introduction de 12 secondes (puis une version de 3 secondes à chaque changement de page) : le visiteur choisit « Activer le Radiant » (avec la bande-son) ou « Entrer sans le son », et peut la passer (bouton ou Échap), puis « projette » les éléments de l'interface qui se déploient à l'écran ; sur l'accueil, les 6 compétences jaillissent de son cœur. Sans JavaScript ou avec « Réduire les animations », tout s'affiche directement. Illustrations originales (aucun visuel de la série).
- `fondation-technique` : la version précédente, claire et technique (grille de plan, HUD, planètes, vaisseau de Seldon).
- `fondation-classique` : la version claire précédente (titres à empattements), conservée pour comparer.
- `fondation-nuit` : l'ancienne version sombre (espace profond, pluie d'équations).

En version statique, le thème actif se choisit dans `data/settings.json`.
