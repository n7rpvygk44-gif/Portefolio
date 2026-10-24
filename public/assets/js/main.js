// Scripts du site public : menu mobile, panneau d'accessibilité, filtre de la base de connaissances.

(function () {
    'use strict';

    const root = document.documentElement;
    const STORAGE_KEY = 'portfolio-a11y';

    // Chaque option du panneau correspond à une classe CSS posée sur <html>.
    const OPTIONS = {
        theme: 'theme-dark',
        large: 'a11y-large',
        contrast: 'a11y-contrast',
        readable: 'a11y-readable',
        motion: 'a11y-motion',
    };

    function loadSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            // Stockage indisponible (navigation privée) : les réglages restent valables pour la page.
        }
    }

    function applySettings(settings) {
        Object.entries(OPTIONS).forEach(([key, className]) => {
            root.classList.toggle(className, Boolean(settings[key]));
            const button = document.querySelector('[data-a11y="' + key + '"]');
            if (button) {
                button.setAttribute('aria-pressed', settings[key] ? 'true' : 'false');
            }
        });
        // Si l'utilisateur a désactivé le mode sombre explicitement, on force le clair.
        root.classList.toggle('theme-light', settings.theme === false);
    }

    let settings = loadSettings();
    applySettings(settings);

    document.querySelectorAll('[data-a11y]').forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.dataset.a11y;
            settings[key] = !settings[key];
            applySettings(settings);
            saveSettings(settings);
        });
    });

    const reset = document.querySelector('[data-a11y-reset]');
    if (reset) {
        reset.addEventListener('click', () => {
            settings = {};
            applySettings(settings);
            saveSettings(settings);
        });
    }

    // Menu mobile
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    // Base de connaissances : filtre instantané pendant la saisie
    // (le formulaire fonctionne aussi sans JavaScript grâce à la recherche côté serveur).
    const filter = document.querySelector('[data-kb-filter]');
    if (filter) {
        const empty = document.querySelector('[data-kb-empty]');
        filter.addEventListener('input', () => {
            const q = filter.value.trim().toLowerCase();
            let visible = 0;
            document.querySelectorAll('[data-kb-section]').forEach((section) => {
                let inSection = 0;
                section.querySelectorAll('.card').forEach((card) => {
                    const match = card.textContent.toLowerCase().includes(q);
                    card.hidden = !match;
                    if (match) {
                        inSection++;
                    }
                });
                section.hidden = inSection === 0;
                visible += inSection;
            });
            if (empty) {
                empty.hidden = visible > 0;
            }
        });

        // Version statique : la recherche arrive dans l'adresse (?q=...), on l'applique au chargement.
        const q = new URLSearchParams(window.location.search).get('q');
        if (q) {
            filter.value = q;
            filter.dispatchEvent(new Event('input'));
        }
    }

    // Compétence choisie depuis l'accueil (#b1-2…) : elle est placée au centre de l'écran.
    // Le navigateur saute d'abord en haut de l'encadré, puis la page bouge encore (polices,
    // animations) : on recentre plusieurs fois, sauf si le visiteur a commencé à défiler.
    function targetCompetence() {
        const id = decodeURIComponent(location.hash.slice(1));
        const target = id ? document.getElementById(id) : null;
        return target && target.classList.contains('competence') ? target : null;
    }
    function centerTarget() {
        const target = targetCompetence();
        if (!target) {
            return;
        }
        // Position réelle dans la page, sans les transformations d'animation.
        let top = 0;
        for (let el = target; el; el = el.offsetParent) {
            top += el.offsetTop;
        }
        const header = document.querySelector('.site-header');
        const pinned = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position);
        const headerHeight = pinned ? header.offsetHeight : 0;
        const room = window.innerHeight - headerHeight;
        const offset = target.offsetHeight < room ? (room - target.offsetHeight) / 2 : 16;
        window.scrollTo(0, Math.max(0, top - headerHeight - offset));
    }
    if (targetCompetence()) {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        let userScrolled = false;
        const stop = () => { userScrolled = true; };
        ['wheel', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, stop, { once: true, passive: true }));
        const again = () => { if (!userScrolled) { centerTarget(); } };
        again();
        document.addEventListener('DOMContentLoaded', again);
        window.addEventListener('load', () => { again(); [150, 500, 1200, 2500, 3200].forEach((ms) => setTimeout(again, ms)); });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(again);
        }
    }
    window.addEventListener('hashchange', centerTarget);
})();
