// Thème « Fondation » (inspiré de la série) :
// - décor : Trantor seule, avec son orbite ;
// - le Radiant : sphère d'équations en 3D autour du plan des compétences ;
// - cinématique : introduction du Radiant (une fois par visite), puis déploiement
//   des éléments de l'interface, comme projetés par le Radiant.
// Le décor est décoratif (aria-hidden). Rien n'est caché sans JavaScript, et les
// animations sont désactivées avec « Réduire les animations » ou le réglage du système.

(function () {
    'use strict';

    // Dossier des images, retrouvé à partir de l'adresse de ce script
    // (fonctionne aussi quand le site est dans un sous-dossier, comme sur GitHub Pages).
    const imgDir = new URL('../../img/fondation/', document.currentScript.src).href;
    const svgNS = 'http://www.w3.org/2000/svg';
    const root = document.documentElement;

    // ----- Décor : Trantor -----
    const scene = document.createElement('div');
    scene.className = 'fondation-scene';
    scene.setAttribute('aria-hidden', 'true');
    const trantor = document.createElement('div');
    trantor.className = 'trantor';
    const crop = document.createElement('div');
    crop.className = 'planet-crop';
    const img = document.createElement('img');
    img.src = imgDir + 'trantor.svg';
    img.alt = '';
    img.decoding = 'async';
    crop.appendChild(img);
    const orbit = document.createElement('div');
    orbit.className = 'orbit';
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'TRANTOR';
    trantor.append(orbit, crop, tag);
    scene.appendChild(trantor);
    document.body.prepend(scene);

    // ----- Anneaux d'équations (SVG) -----
    // Équations de « psychohistoire » inventées pour le décor.
    const equations = [
        'Ψ(t) = Σ pᵢ · e^(λᵢ t) · ∂Ω/∂t = −∇·J · lim n→∞ σ/√n · ',
        'P(A|B) = P(B|A) P(A) / P(B) · ∫ ρ(x,t) dx = 1 · Δ ≤ 1 / 1 000 ans · ',
        'Seldon · Terminus · Trantor · ∮ F·dl · dS ≥ 0 · μ ± 2σ · ',
        'H = −Σ pᵢ log pᵢ · ∇²φ = 4πGρ · x(n+1) = r x(n) (1 − x(n)) · ',
    ];
    let ringId = 0;
    function ring(options) {
        const wrap = document.createElement('div');
        wrap.className = 'ring';
        wrap.style.setProperty('--rx', options.rx + 'deg');
        wrap.style.setProperty('--ry', options.ry + 'deg');
        wrap.style.setProperty('--speed', options.speed + 's');
        if (options.delay !== undefined) {
            wrap.style.setProperty('--delay', options.delay + 's');
        }
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('aria-hidden', 'true');
        const id = 'radiant-path-' + (++ringId);
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('id', id);
        path.setAttribute('d', 'M50,8 a42,42 0 1,1 -0.01,0');
        path.setAttribute('fill', 'none');
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', '50');
        circle.setAttribute('cy', '50');
        circle.setAttribute('r', '46');
        const dash = document.createElementNS(svgNS, 'circle');
        dash.setAttribute('class', 'dash');
        dash.setAttribute('cx', '50');
        dash.setAttribute('cy', '50');
        dash.setAttribute('r', '38');
        const text = document.createElementNS(svgNS, 'text');
        const textPath = document.createElementNS(svgNS, 'textPath');
        textPath.setAttribute('href', '#' + id);
        textPath.textContent = options.text + options.text;
        text.appendChild(textPath);
        svg.append(path, circle, dash, text);
        wrap.appendChild(svg);
        return wrap;
    }
    // Orientation des anneaux : ensemble, ils dessinent une sphère.
    const layout = [
        { rx: 70, ry: 0, speed: 50 },
        { rx: 70, ry: 60, speed: 65 },
        { rx: 70, ry: 120, speed: 80 },
        { rx: 0, ry: 0, speed: 120 },
    ];
    function sphere(className, delays) {
        const el = document.createElement('div');
        el.className = className;
        el.setAttribute('aria-hidden', 'true');
        layout.forEach((l, i) => {
            el.appendChild(ring(Object.assign({ text: equations[i], delay: delays ? delays[i] : undefined }, l)));
        });
        return el;
    }
    function core() {
        const el = document.createElement('div');
        el.className = 'radiant-core';
        el.setAttribute('aria-hidden', 'true');
        return el;
    }

    // ----- Le Radiant de l'accueil -----
    const radiant = document.querySelector('.radiant');
    if (radiant) {
        radiant.prepend(sphere('radiant-sphere'), core());
    }

    // ----- Cinématique -----
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        || root.classList.contains('a11y-motion')
        || root.classList.contains('a11y-contrast');
    if (reduce || !('IntersectionObserver' in window)) {
        return;
    }

    // Éléments à déployer : en-tête, blocs de la page, cartes, pied de page.
    const items = [];
    const add = (el) => { if (el && !items.includes(el)) { items.push(el); } };
    add(document.querySelector('.header-inner'));
    document.querySelectorAll('main > *:not(.plan):not(script), .plan > h2, .plan > .lead, main .cards > li, main .competence, .site-footer .container').forEach(add);
    items.forEach((el) => el.classList.add('fx-item'));
    root.classList.add('fx');

    // Les éléments visibles au chargement se déploient en cascade ; les autres
    // au moment où ils entrent à l'écran.
    let wave = 0;
    let started = false;
    const pending = [];
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            observer.unobserve(entry.target);
            if (started) {
                reveal(entry.target);
            } else {
                pending.push(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -4% 0px' });
    function reveal(el) {
        el.style.setProperty('--i', String(Math.min(wave++, 12)));
        el.classList.add('is-in');
        document.dispatchEvent(new CustomEvent('portfolio:reveal'));
        // Les éléments suivants qui apparaissent au défilement ne patientent pas.
        clearTimeout(reveal.timer);
        reveal.timer = setTimeout(() => { wave = 0; }, 200);
    }
    items.forEach((el) => observer.observe(el));
    // En bas de page, les derniers éléments n'atteignent pas toujours la zone d'observation.
    window.addEventListener('scroll', () => {
        if (started && window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
            items.forEach((el) => { if (!el.classList.contains('is-in')) { observer.unobserve(el); reveal(el); } });
        }
    }, { passive: true });
    // Sécurité : un élément atteint au clavier, ou une impression, affiche tout de suite le contenu.
    document.addEventListener('focusin', (event) => {
        const item = event.target.closest('.fx-item:not(.is-in)');
        if (item) {
            item.classList.add('is-in');
        }
    });
    window.addEventListener('beforeprint', () => {
        items.forEach((el) => el.classList.add('is-in'));
        if (radiant) {
            radiant.classList.add('is-in');
        }
    });
    if (radiant) {
        observer.observe(radiant);
    }
    function start() {
        if (started) {
            return;
        }
        started = true;
        pending.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).forEach(reveal);
    }

    // Introduction du Radiant : complète (12 s) à la première page de la visite,
    // courte (3 s) à chaque changement de page.
    let seen = false;
    try {
        seen = sessionStorage.getItem('fondation-intro') === '1';
        sessionStorage.setItem('fondation-intro', '1');
    } catch (e) {
        seen = false;
    }
    const FULL = { total: 12, wake: 2, rings: [2.4, 3.6, 4.8, 6], ringDur: 3.2, outDur: 0.9 };
    const SHORT = { total: 3, wake: 0.6, rings: [0.25, 0.5, 0.75, 1], ringDur: 1.1, outDur: 0.6 };
    const T = seen ? SHORT : FULL;
    T.end = T.total - T.outDur;

    const intro = document.createElement('div');
    intro.className = 'radiant-intro' + (seen ? ' short' : '');
    [['--wake', T.wake], ['--ring-dur', T.ringDur], ['--turn', T.total], ['--out-at', T.end], ['--out-dur', T.outDur]].forEach(([name, value]) => {
        intro.style.setProperty(name, value + 's');
    });
    const stage = document.createElement('div');
    stage.className = 'stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.append(sphere('sphere', T.rings), core());
    // Les anneaux de l'introduction sont posés directement dans la scène.
    const introSphere = stage.firstChild;
    while (introSphere.firstChild) {
        stage.insertBefore(introSphere.firstChild, introSphere);
    }
    introSphere.remove();
    const title = document.createElement('p');
    title.className = 'title';
    title.setAttribute('aria-hidden', 'true');
    const name = document.querySelector('.brand');
    title.textContent = name ? name.textContent.trim() : '';
    const sub = document.createElement('span');
    const heading = document.querySelector('main h1');
    sub.textContent = seen && heading ? heading.textContent.trim() : 'Plan Seldon · Portfolio';
    title.appendChild(sub);

    const gate = document.createElement('div');
    gate.className = 'gate';
    const activate = document.createElement('button');
    activate.type = 'button';
    activate.className = 'activate';
    activate.textContent = 'Activer le Radiant';
    const silent = document.createElement('button');
    silent.type = 'button';
    silent.className = 'silent';
    silent.textContent = 'Entrer sans le son';
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Expérience sonore : activez le son de votre appareil';
    gate.append(activate, silent, hint);

    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'skip';
    skip.textContent = 'Passer l\'introduction';
    intro.append(stage, title, gate, skip);
    document.body.appendChild(intro);

    let done = false;
    let running = false;
    function finish() {
        if (done) {
            return;
        }
        done = true;
        intro.remove();
        document.removeEventListener('keydown', onKey);
        start();
    }
    function run(withSound) {
        if (running) {
            return;
        }
        running = true;
        intro.classList.add('active');
        if (window.portfolioSound) {
            if (seen) {
                window.portfolioSound.playIntro(T, 'short');
            } else if (withSound) {
                window.portfolioSound.playIntro(T, 'full');
            } else {
                window.portfolioSound.disable();
            }
        }
        if (!seen) {
            skip.focus({ preventScroll: true });
        }
        // Le déploiement de l'interface commence pendant que l'introduction s'efface.
        setTimeout(start, (T.end + 0.1) * 1000);
        setTimeout(finish, T.total * 1000);
    }
    function onKey(event) {
        if (event.key === 'Escape') {
            finish();
        }
    }
    document.addEventListener('keydown', onKey);
    intro.addEventListener('click', () => {
        if (seen) {
            finish();
        }
    });
    if (seen) {
        run(false);
    } else {
        activate.focus({ preventScroll: true });
        activate.addEventListener('click', () => run(true));
        silent.addEventListener('click', () => run(false));
        stage.addEventListener('click', () => run(true));
        skip.addEventListener('click', finish);
    }
})();
