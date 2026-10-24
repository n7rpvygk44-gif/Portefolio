// Supervision : mesure ce que le site consomme dans le navigateur (réseau, cache, fluidité, signaux vitaux).
// Sur chaque page, un relevé discret est ajouté au bilan de la visite (sessionStorage, cet onglet seulement).
// Sur la page Supervision, les mesures sont animées en temps réel. Rien n'est envoyé hors du navigateur.
(function () {
    'use strict';

    const perf = window.performance;
    if (!perf || !perf.getEntriesByType) {
        return;
    }
    const VISIT_KEY = 'supervision-visite';

    // ----- Familles de fichiers -----
    const TYPES = [
        { id: 'html', label: 'Pages HTML', col: [21, 25, 37] },
        { id: 'css', label: 'Styles CSS', col: [200, 149, 47] },
        { id: 'js', label: 'Scripts JavaScript', col: [138, 90, 18] },
        { id: 'font', label: 'Polices', col: [130, 70, 160] },
        { id: 'img', label: 'Images', col: [40, 130, 110] },
        { id: 'data', label: 'Données et mesures', col: [60, 110, 190] },
        { id: 'other', label: 'Autres', col: [150, 150, 145] },
    ];
    const TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t]));
    function typeOf(entry) {
        if (entry.entryType === 'navigation') {
            return 'html';
        }
        const path = (entry.name.split('?')[0] || '').toLowerCase();
        if (/\.css$/.test(path) || entry.initiatorType === 'css' && /\.css$/.test(path)) {
            return 'css';
        }
        if (/\.m?js$/.test(path) || entry.initiatorType === 'script') {
            return 'js';
        }
        if (/\.(woff2?|ttf|otf)$/.test(path)) {
            return 'font';
        }
        if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(path) || entry.initiatorType === 'img') {
            return 'img';
        }
        if (/\.(json|txt|xml)$/.test(path) || entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            return 'data';
        }
        if (/\.html?$/.test(path) || entry.initiatorType === 'iframe') {
            return 'html';
        }
        return 'other';
    }

    // Un fichier pris dans le cache n'a rien transféré sur le réseau (transferSize = 0) alors qu'il a un contenu.
    const isCached = (e) => e.transferSize === 0 && (e.decodedBodySize > 0 || e.encodedBodySize > 0);
    function entries() {
        return perf.getEntriesByType('navigation').concat(perf.getEntriesByType('resource'))
            .filter((e) => !/[?&]sonde=/.test(e.name));
    }
    function summary() {
        const list = entries();
        const s = { requests: list.length, transfer: 0, decoded: 0, encoded: 0, cached: 0, byType: {} };
        TYPES.forEach((t) => { s.byType[t.id] = 0; });
        list.forEach((e) => {
            s.transfer += e.transferSize || 0;
            s.decoded += e.decodedBodySize || 0;
            s.encoded += e.encodedBodySize || 0;
            s.cached += isCached(e) ? 1 : 0;
            s.byType[typeOf(e)] += e.decodedBodySize || e.transferSize || 0;
        });
        return s;
    }

    function readVisit() {
        try {
            return JSON.parse(sessionStorage.getItem(VISIT_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }
    // Relevé de la page courante, une fois le chargement terminé.
    function record() {
        const s = summary();
        const visit = readVisit();
        const path = location.pathname;
        const title = (document.querySelector('main h1') || {}).textContent || document.title;
        visit.push({ path, title: title.trim().slice(0, 60), at: Date.now(), transfer: s.transfer, decoded: s.decoded, requests: s.requests, cached: s.cached });
        try {
            sessionStorage.setItem(VISIT_KEY, JSON.stringify(visit.slice(-40)));
        } catch (e) {
            // Stockage indisponible (navigation privée) : le bilan reste vide.
        }
    }
    const afterLoad = (fn) => (document.readyState === 'complete' ? setTimeout(fn, 600) : window.addEventListener('load', () => setTimeout(fn, 600), { once: true }));
    afterLoad(record);

    const board = document.getElementById('supervision');
    if (!board) {
        return;
    }

    // ----- Outils communs -----
    const root = document.documentElement;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('a11y-motion');
    const css = getComputedStyle(document.body);
    const colour = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
    const INK = colour('--text', '#161a26');
    const MUTED = colour('--muted', '#555a68');
    const GOLD = colour('--gold', colour('--accent', '#c8952f'));
    const LINE = 'rgba(150, 110, 40, 0.25)';
    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
    const out = (name, text) => board.querySelectorAll('[data-out="' + name + '"]').forEach((el) => { el.textContent = text; });
    function bytes(n) {
        if (n < 1024) {
            return Math.round(n) + ' o';
        }
        if (n < 1024 * 1024) {
            return (n / 1024).toFixed(n < 10240 ? 1 : 0).replace('.', ',') + ' Ko';
        }
        return (n / 1048576).toFixed(2).replace('.', ',') + ' Mo';
    }
    const ms = (n) => (n < 10 ? n.toFixed(1).replace('.', ',') : Math.round(n)) + ' ms';
    const font = (size, weight) => (weight || 500) + ' ' + size + 'px ' + colour('--mono', 'ui-monospace, monospace');

    // Chaque graphique est un canvas à la largeur de son panneau, net sur les écrans haute densité.
    const charts = {};
    board.querySelectorAll('canvas[data-chart]').forEach((canvas) => {
        charts[canvas.dataset.chart] = { canvas, c: canvas.getContext('2d'), w: 0, h: 0, dpr: 1 };
    });
    function fit() {
        Object.values(charts).forEach((ch) => {
            const w = Math.max(200, ch.canvas.parentElement.clientWidth - 2);
            // data-ratio-narrow : proportions sur un panneau étroit (mobile), quand la disposition change.
            const narrow = w < 640 && ch.canvas.dataset.ratioNarrow;
            const ratio = parseFloat(narrow || ch.canvas.dataset.ratio) || 0.5;
            const h = Math.round(Math.max(160, Math.min(380, w * ratio * (w < 520 && !narrow ? 1.5 : 1))));
            ch.dpr = Math.min(window.devicePixelRatio || 1, 2);
            ch.w = w;
            ch.h = h;
            ch.canvas.width = Math.round(w * ch.dpr);
            ch.canvas.height = Math.round(h * ch.dpr);
            ch.canvas.style.setProperty('width', w + 'px');
            ch.canvas.style.setProperty('height', h + 'px');
        });
    }
    fit();
    window.addEventListener('resize', fit);
    const begin = (ch) => {
        ch.c.setTransform(ch.dpr, 0, 0, ch.dpr, 0, 0);
        ch.c.clearRect(0, 0, ch.w, ch.h);
        return ch.c;
    };
    const t0 = perf.now();
    const age = () => (calm ? 99 : (perf.now() - t0) / 1000);   // secondes depuis l'ouverture de la page

    // ----- Collecte en direct -----
    const state = {
        pings: [],            // { at, rtt } ou { at, lost: true }
        fps: [],              // images par seconde, une valeur toutes les 500 ms
        longTasks: 0,
        longTaskSupported: false,
        vitals: { fcp: null, lcp: null, cls: null, inp: null },
        supported: { lcp: false, cls: false, inp: false },
        packets: [],          // particules du flux
    };
    const supports = (type) => (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes || []).includes(type);
    function observe(type, fn, opts) {
        if (!supports(type)) {
            return false;
        }
        try {
            new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe(Object.assign({ type, buffered: true }, opts));
            return true;
        } catch (e) {
            return false;
        }
    }
    const fcp = perf.getEntriesByName('first-contentful-paint')[0];
    state.vitals.fcp = fcp ? fcp.startTime : null;
    observe('paint', (e) => { if (e.name === 'first-contentful-paint') { state.vitals.fcp = e.startTime; } });
    state.supported.lcp = observe('largest-contentful-paint', (e) => { state.vitals.lcp = e.startTime; });
    state.supported.cls = observe('layout-shift', (e) => { if (!e.hadRecentInput) { state.vitals.cls = (state.vitals.cls || 0) + e.value; } });
    if (state.supported.cls && state.vitals.cls === null) {
        state.vitals.cls = 0;
    }
    state.supported.inp = observe('event', (e) => { if (e.interactionId) { state.vitals.inp = Math.max(state.vitals.inp || 0, e.duration); } }, { durationThreshold: 16 });
    state.longTaskSupported = observe('longtask', () => { state.longTasks++; });
    // Nouveaux fichiers chargés pendant que la page est ouverte : ils rejoignent le flux.
    observe('resource', (e) => {
        if (perf.now() - e.responseEnd < 3000 && !/[?&]sonde=/.test(e.name)) {
            launch(e, 0);
        }
    });

    // Images par seconde, comptées sur la boucle d'affichage du navigateur.
    let frames = 0;
    let fpsFrom = perf.now();
    function countFrame(now) {
        frames++;
        if (now - fpsFrom >= 500) {
            state.fps.push(frames * 1000 / (now - fpsFrom));
            state.fps = state.fps.slice(-120);
            frames = 0;
            fpsFrom = now;
        }
    }

    // « Ping » : un petit fichier du site demandé sans cache, le temps aller-retour mesuré.
    const brand = document.querySelector('.brand');
    const probeUrl = new URL('robots.txt', brand ? brand.href : location.origin + '/').href;
    function ping() {
        if (document.hidden) {
            return;
        }
        const start = perf.now();
        const ctrl = window.AbortController ? new AbortController() : null;
        const timer = setTimeout(() => ctrl && ctrl.abort(), 4000);
        state.packets.push({ kind: 'ping', born: age(), dur: 0.9 });
        fetch(probeUrl + '?sonde=' + Date.now(), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
            .then((r) => r.text().then(() => {
                const rtt = perf.now() - start;
                state.pings.push(r.ok ? { at: Date.now(), rtt } : { at: Date.now(), lost: true });
                state.packets.push({ kind: 'pong', born: age(), dur: 0.9, ok: r.ok });
            }))
            .catch(() => state.pings.push({ at: Date.now(), lost: true }))
            .finally(() => {
                clearTimeout(timer);
                state.pings = state.pings.slice(-60);
                textPing();
            });
    }

    // ----- 1. Flux de données -----
    // Trois nœuds : le serveur, le cache du navigateur et le navigateur. Les fichiers déjà chargés
    // sont rejoués à l'ouverture dans leur ordre réel, puis les nouveaux arrivent en direct.
    function launch(e, delay) {
        const size = e.decodedBodySize || e.transferSize || 500;
        state.packets.push({
            kind: isCached(e) ? 'cache' : 'net', type: typeOf(e), born: age() + delay,
            dur: 1.4 + Math.random() * 0.6, r: 3 + Math.min(8, Math.log2(1 + size / 1024) * 1.4),
            lane: (Math.random() - 0.5) * 0.5, name: decodeURIComponent((e.name.split('?')[0].split('/').pop() || 'page')).slice(0, 28),
        });
    }
    // Rejoue le chargement de la page : les fichiers partent dans leur ordre réel, étalés sur 3 s.
    function replay() {
        entries().sort((a, b) => a.startTime - b.startTime).forEach((e, i, all) => {
            launch(e, 0.3 + (i / Math.max(1, all.length - 1)) * 3 + Math.random() * 0.2);
        });
    }
    replay();
    // Puis en boucle, comme un écran de supervision qui tourne en permanence.
    if (!calm) {
        setInterval(() => { if (!document.hidden) { replay(); } }, 7000);
    }

    function drawFlux() {
        const ch = charts.flux;
        if (!ch) {
            return;
        }
        const c = begin(ch);
        const { w, h } = ch;
        const now = age();
        const server = { x: w * 0.1, y: h * 0.42, label: 'SERVEUR' };
        const cache = { x: w * 0.1, y: h * 0.84, label: 'CACHE' };
        const browser = { x: w * 0.88, y: h * 0.56, label: 'NAVIGATEUR' };
        // Liaisons : courbes fines, avec un trait pointillé qui défile pour montrer le sens.
        const curve = (a, b, bend) => {
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + bend;
            return (t) => {
                const u = 1 - t;
                return [u * u * a.x + 2 * u * t * mx + t * t * b.x, u * u * a.y + 2 * u * t * my + t * t * b.y];
            };
        };
        const net = curve(server, browser, -h * 0.28);
        const loc = curve(cache, browser, h * 0.12);
        [[net, 1], [loc, 0.6]].forEach(([path, alpha]) => {
            c.strokeStyle = rgba([200, 149, 47], 0.35 * alpha);
            c.lineWidth = 1;
            c.setLineDash([4, 6]);
            c.lineDashOffset = -now * 30;
            c.beginPath();
            for (let i = 0; i <= 40; i++) {
                const p = path(i / 40);
                i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
            }
            c.stroke();
        });
        c.setLineDash([]);
        // Nœuds : anneaux dorés qui pulsent quand un fichier part ou arrive.
        let arriving = 0;
        state.packets.forEach((p) => {
            const t = (now - p.born) / p.dur;
            if (t > 0.92 && t < 1.15 && p.kind !== 'ping') {
                arriving++;
            }
        });
        [server, cache, browser].forEach((n, i) => {
            const pulse = i === 2 ? Math.min(1, arriving * 0.25) : 0;
            const r = Math.max(14, Math.min(w, h) * 0.075);
            const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * (2 + pulse));
            g.addColorStop(0, rgba([255, 214, 140], 0.55 + 0.3 * pulse));
            g.addColorStop(1, rgba([255, 214, 140], 0));
            c.fillStyle = g;
            c.beginPath();
            c.arc(n.x, n.y, r * (2 + pulse), 0, 6.283);
            c.fill();
            c.strokeStyle = GOLD;
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(n.x, n.y, r, 0, 6.283);
            c.stroke();
            c.beginPath();
            c.arc(n.x, n.y, r * 0.62, now * (i ? -1.2 : 1.5), now * (i ? -1.2 : 1.5) + 4);
            c.stroke();
            c.fillStyle = INK;
            c.font = font(Math.max(9, Math.min(12, w / 70)), 600);
            c.textAlign = 'center';
            c.fillText(n.label, n.x, n.y + r + 16);
        });
        // Particules en vol.
        let label = null;
        state.packets = state.packets.filter((p) => now - p.born < p.dur + 0.4);
        state.packets.forEach((p) => {
            const t = (now - p.born) / p.dur;
            if (t < 0 || t > 1) {
                return;
            }
            const f = ease(t);
            if (p.kind === 'ping' || p.kind === 'pong') {
                // Sonde de latence : un éclat blanc-or, aller puis retour.
                const pos = net(p.kind === 'ping' ? 1 - f : f);
                c.fillStyle = p.ok === false ? 'rgba(200, 60, 50, 0.9)' : 'rgba(255, 250, 235, 0.95)';
                c.strokeStyle = GOLD;
                c.beginPath();
                c.arc(pos[0], pos[1], 3.2, 0, 6.283);
                c.fill();
                c.stroke();
                return;
            }
            const path = p.kind === 'cache' ? loc : net;
            const pos = path(f);
            const back = path(Math.max(0, f - 0.08));
            const off = p.lane * h * 0.18 * Math.sin(t * Math.PI);
            const col = TYPE[p.type].col;
            c.strokeStyle = rgba(col, 0.35);
            c.lineWidth = Math.max(1, p.r * 0.6);
            c.beginPath();
            c.moveTo(back[0], back[1] + off);
            c.lineTo(pos[0], pos[1] + off);
            c.stroke();
            c.fillStyle = rgba(col, 0.9);
            c.beginPath();
            c.arc(pos[0], pos[1] + off, p.r, 0, 6.283);
            c.fill();
            if (!label || p.r > label.r) {
                label = { x: pos[0], y: pos[1] + off, r: p.r, name: p.name };
            }
        });
        if (label && w > 420) {
            c.fillStyle = MUTED;
            c.font = font(10);
            c.textAlign = 'left';
            c.fillText(label.name, label.x + label.r + 6, label.y - label.r - 4);
        }
    }

    function textFlux() {
        const s = summary();
        out('requests', String(s.requests));
        out('transfer', bytes(s.transfer));
        out('decoded', bytes(s.decoded));
        out('compression', s.encoded && s.decoded > s.encoded ? '−' + Math.round((1 - s.encoded / s.decoded) * 100) + ' %' : 'aucun');
        out('cached', s.cached + ' sur ' + s.requests + ' (' + Math.round(s.cached / Math.max(1, s.requests) * 100) + ' %)');
        const legend = board.querySelector('[data-out="types"]');
        const total = Object.values(s.byType).reduce((a, b) => a + b, 0) || 1;
        legend.replaceChildren(...TYPES.filter((t) => s.byType[t.id] > 0).map((t) => {
            const li = document.createElement('li');
            const sw = document.createElement('span');
            sw.className = 'sv-swatch';
            sw.style.setProperty('background', rgba(t.col, 1));
            li.append(sw, t.label + ' : ' + bytes(s.byType[t.id]) + ' (' + Math.round(s.byType[t.id] / total * 100) + ' %)');
            return li;
        }));
        return s;
    }

    // ----- 2. Répartition par type : un anneau segmenté qui se déploie, comme un cadran -----
    let typeSummary = null;
    function drawTypes() {
        const ch = charts.types;
        if (!ch || !typeSummary) {
            return;
        }
        const c = begin(ch);
        const { w, h } = ch;
        const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
        const grow = ease((age() - 0.3) / 1.6);
        const total = Object.values(typeSummary.byType).reduce((a, b) => a + b, 0) || 1;
        let a = -Math.PI / 2;
        // Graduations du cadran.
        c.strokeStyle = LINE;
        c.lineWidth = 1;
        for (let i = 0; i < 60; i++) {
            const g = (i / 60) * 6.283, k = i % 5 ? 1.08 : 1.14;
            c.beginPath();
            c.moveTo(cx + Math.cos(g) * R * 1.02, cy + Math.sin(g) * R * 1.02);
            c.lineTo(cx + Math.cos(g) * R * k, cy + Math.sin(g) * R * k);
            c.stroke();
        }
        TYPES.forEach((t) => {
            const part = typeSummary.byType[t.id] / total;
            if (!part) {
                return;
            }
            const sweep = part * 6.283 * grow;
            c.strokeStyle = rgba(t.col, 0.92);
            c.lineWidth = R * 0.26;
            c.beginPath();
            c.arc(cx, cy, R * 0.82, a + 0.012, a + Math.max(0.013, sweep - 0.012));
            c.stroke();
            a += sweep;
        });
        // Aiguille qui balaie le cadran en continu.
        const sweepAngle = age() * 0.8;
        c.strokeStyle = rgba([200, 149, 47], 0.6);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(sweepAngle) * R * 1.12, cy + Math.sin(sweepAngle) * R * 1.12);
        c.stroke();
        c.fillStyle = INK;
        c.textAlign = 'center';
        c.font = font(Math.max(14, R * 0.26), 600);
        c.fillText(bytes(total * grow), cx, cy + 4);
        c.fillStyle = MUTED;
        c.font = font(10);
        c.fillText('DANS LA PAGE', cx, cy + R * 0.26);
    }

    // ----- 3. Chronologie du chargement : les barres se tracent dans l'ordre réel -----
    const nav = perf.getEntriesByType('navigation')[0];
    const steps = [];
    if (nav) {
        const add = (label, from, to, col) => { if (to > from && from >= 0) { steps.push({ label, from, to, col }); } };
        add('Redirection', nav.redirectStart, nav.redirectEnd, [150, 150, 145]);
        add('Résolution DNS', nav.domainLookupStart, nav.domainLookupEnd, [60, 110, 190]);
        add('Connexion TCP', nav.connectStart, nav.secureConnectionStart > 0 ? nav.secureConnectionStart : nav.connectEnd, [40, 130, 110]);
        add('Chiffrement TLS', nav.secureConnectionStart, nav.connectEnd, [130, 70, 160]);
        add('Attente du serveur', nav.requestStart, nav.responseStart, [200, 149, 47]);
        add('Téléchargement', nav.responseStart, nav.responseEnd, [138, 90, 18]);
        add('Construction de la page', nav.responseEnd, nav.domInteractive, [21, 25, 37]);
        add('Scripts et styles', nav.domInteractive, nav.domContentLoadedEventEnd, [100, 105, 120]);
        add('Chargement complet', nav.domContentLoadedEventEnd, nav.loadEventEnd || nav.domComplete, [180, 120, 60]);
        if (!steps.length) {
            add('Réponse', 0, nav.responseEnd, [200, 149, 47]);
        }
    }
    function drawChrono() {
        const ch = charts.chrono;
        if (!ch) {
            return;
        }
        const c = begin(ch);
        const { w, h } = ch;
        if (!steps.length) {
            c.fillStyle = MUTED;
            c.font = font(12);
            c.fillText('Chronologie indisponible dans ce navigateur.', 10, 24);
            return;
        }
        const end = Math.max(...steps.map((s) => s.to));
        const left = 10, right = w - 10, top = 14, rowH = (h - top - 26) / steps.length;
        const x = (t) => left + (t / end) * (right - left);
        // Grille de temps.
        c.strokeStyle = LINE;
        c.fillStyle = MUTED;
        c.font = font(9);
        c.textAlign = 'center';
        const tick = end > 2000 ? 500 : end > 800 ? 200 : end > 300 ? 100 : 50;
        for (let t = 0; t <= end; t += tick) {
            c.beginPath();
            c.moveTo(x(t), top);
            c.lineTo(x(t), h - 20);
            c.stroke();
            c.fillText(Math.round(t) + ' ms', x(t), h - 6);
        }
        // Les barres apparaissent au rythme du vrai chargement, ralenti pour être lisible.
        const clock = age() * end / 2.2;
        steps.forEach((s, i) => {
            const y = top + i * rowH;
            const shown = Math.min(s.to, clock);
            if (shown <= s.from) {
                return;
            }
            c.fillStyle = rgba(s.col, 0.85);
            c.fillRect(x(s.from), y + rowH * 0.22, Math.max(2, x(shown) - x(s.from)), rowH * 0.56);
            c.font = font(Math.max(9, Math.min(11, rowH * 0.5)));
            // Étiquette à droite de la barre, ou dans la barre (en clair) quand la place manque.
            const tw = c.measureText(s.label).width;
            if (x(shown) + 6 + tw < right) {
                c.fillStyle = INK;
                c.textAlign = 'left';
                c.fillText(s.label, x(shown) + 6, y + rowH * 0.66);
            } else if (x(s.from) - 6 - tw > left) {
                c.fillStyle = INK;
                c.textAlign = 'right';
                c.fillText(s.label, x(s.from) - 6, y + rowH * 0.66);
            } else {
                c.fillStyle = '#fffaf0';
                c.textAlign = 'left';
                c.fillText(s.label, x(s.from) + 6, y + rowH * 0.66);
            }
        });
        // Curseur doré qui suit le temps rejoué.
        if (clock < end) {
            c.strokeStyle = GOLD;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(x(clock), top);
            c.lineTo(x(clock), h - 20);
            c.stroke();
        }
    }
    function textChrono() {
        const legend = board.querySelector('[data-out="chrono"]');
        legend.replaceChildren(...steps.map((s) => {
            const li = document.createElement('li');
            li.textContent = s.label + ' : ' + ms(s.to - s.from);
            return li;
        }));
        if (nav) {
            const li = document.createElement('li');
            li.className = 'sv-total';
            li.textContent = 'Page prête en ' + ms(nav.loadEventEnd || nav.domComplete || nav.responseEnd) + ' (protocole ' + (nav.nextHopProtocol || 'inconnu') + ')';
            legend.appendChild(li);
        }
    }

    // ----- 4 et 5. Courbes en direct : un oscilloscope qui défile -----
    function scope(ch, values, max, unit, warn, bad, empty) {
        const c = begin(ch);
        const { w, h } = ch;
        const left = 42, top = 10, bottom = h - 18;
        const y = (v) => bottom - Math.min(1, v / max) * (bottom - top);
        c.strokeStyle = LINE;
        c.fillStyle = MUTED;
        c.font = font(9);
        c.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const v = (max / 4) * i;
            c.beginPath();
            c.moveTo(left, y(v));
            c.lineTo(w - 6, y(v));
            c.stroke();
            c.fillText(Math.round(v) + unit, left - 6, y(v) + 3);
        }
        // Bandes de seuil (à surveiller, critique).
        if (warn !== null) {
            c.fillStyle = 'rgba(232, 150, 40, 0.07)';
            c.fillRect(left, Math.min(y(warn), y(bad)), w - 6 - left, Math.abs(y(bad) - y(warn)));
        }
        const pts = values.slice(-60);
        if (!pts.length) {
            c.fillStyle = MUTED;
            c.textAlign = 'left';
            c.font = font(11);
            c.fillText(empty, left + 8, (top + bottom) / 2);
            return;
        }
        const step = (w - 6 - left) / 59;
        const x0 = w - 6 - (pts.length - 1) * step;
        const grad = c.createLinearGradient(0, top, 0, bottom);
        grad.addColorStop(0, 'rgba(200, 149, 47, 0.35)');
        grad.addColorStop(1, 'rgba(200, 149, 47, 0)');
        c.beginPath();
        pts.forEach((v, i) => (i ? c.lineTo(x0 + i * step, y(v)) : c.moveTo(x0, y(v))));
        c.lineTo(x0 + (pts.length - 1) * step, bottom);
        c.lineTo(x0, bottom);
        c.closePath();
        c.fillStyle = grad;
        c.fill();
        c.strokeStyle = GOLD;
        c.lineWidth = 1.8;
        c.beginPath();
        pts.forEach((v, i) => (i ? c.lineTo(x0 + i * step, y(v)) : c.moveTo(x0, y(v))));
        c.stroke();
        // Point lumineux sur la dernière mesure.
        const lx = x0 + (pts.length - 1) * step, ly = y(pts[pts.length - 1]);
        const halo = c.createRadialGradient(lx, ly, 0, lx, ly, 12);
        halo.addColorStop(0, 'rgba(255, 220, 150, 0.9)');
        halo.addColorStop(1, 'rgba(255, 220, 150, 0)');
        c.fillStyle = halo;
        c.fillRect(lx - 12, ly - 12, 24, 24);
        c.fillStyle = '#fffaf0';
        c.beginPath();
        c.arc(lx, ly, 2.5, 0, 6.283);
        c.fill();
    }
    function drawPing() {
        if (!charts.ping) {
            return;
        }
        const values = state.pings.filter((p) => !p.lost).map((p) => p.rtt);
        const max = Math.max(100, Math.ceil(Math.max(0, ...values) / 50) * 50);
        scope(charts.ping, values, max, '', 150, max, 'Première mesure en cours…');
        // Pertes : marques rouges en bas de l'écran.
        const c = charts.ping.c;
        state.pings.slice(-60).forEach((p, i, all) => {
            if (p.lost) {
                const x = charts.ping.w - 6 - (all.length - 1 - i) * ((charts.ping.w - 48) / 59);
                c.fillStyle = 'rgba(200, 60, 50, 0.85)';
                c.fillRect(x - 1.5, charts.ping.h - 22, 3, 6);
            }
        });
    }
    function textPing() {
        const ok = state.pings.filter((p) => !p.lost).map((p) => p.rtt);
        if (!state.pings.length) {
            return;
        }
        const last = state.pings[state.pings.length - 1];
        out('ping-last', last.lost ? 'perdue' : ms(last.rtt));
        out('ping-avg', ok.length ? ms(ok.reduce((a, b) => a + b, 0) / ok.length) : '—');
        let jitter = 0;
        for (let i = 1; i < ok.length; i++) {
            jitter += Math.abs(ok[i] - ok[i - 1]);
        }
        out('ping-jitter', ok.length > 1 ? ms(jitter / (ok.length - 1)) : '—');
        out('ping-loss', Math.round((state.pings.length - ok.length) / state.pings.length * 100) + ' % (' + state.pings.length + ' sondes)');
    }
    function drawFps() {
        if (charts.fps) {
            scope(charts.fps, state.fps, 120, '', 30, 50, calm ? 'Mesure en pause : animations réduites.' : 'Mesure en cours…');
        }
    }
    function textFps() {
        const last = state.fps.slice(-4);
        out('fps', last.length ? Math.round(last.reduce((a, b) => a + b, 0) / last.length) + ' i/s' : (calm ? 'en pause' : '…'));
        out('longtasks', state.longTaskSupported ? String(state.longTasks) : 'indisponible ici');
        const mem = perf.memory;
        out('memory', mem && mem.usedJSHeapSize ? bytes(mem.usedJSHeapSize) + ' / ' + bytes(mem.jsHeapSizeLimit) : 'indisponible ici');
    }

    // ----- 6. Signaux vitaux : jauges en arc, aiguille qui se pose sur la valeur -----
    const VITALS = [
        { id: 'fcp', label: 'Premier affichage', good: 1800, poor: 3000, max: 4000, fmt: ms, always: true },
        { id: 'lcp', label: 'Plus grand élément', good: 2500, poor: 4000, max: 6000, fmt: ms },
        { id: 'cls', label: 'Stabilité visuelle', good: 0.1, poor: 0.25, max: 0.5, fmt: (v) => v.toFixed(3).replace('.', ',') },
        { id: 'inp', label: 'Réactivité aux clics', good: 200, poor: 500, max: 800, fmt: ms },
    ];
    const shownVital = {};
    function drawVitals() {
        const ch = charts.vitals;
        if (!ch) {
            return;
        }
        const c = begin(ch);
        const { w, h } = ch;
        const cols = w < 640 ? 2 : 4, rows = Math.ceil(VITALS.length / cols);
        const cw = w / cols, rh = h / rows;
        VITALS.forEach((v, i) => {
            const cx = cw * (i % cols) + cw / 2, cy = rh * Math.floor(i / cols) + rh * 0.62;
            const R = Math.min(cw * 0.38, rh * 0.48);
            const from = Math.PI * 0.8, span = Math.PI * 1.4;
            // Zones verte, orange et rouge.
            [[0, v.good, [40, 140, 90]], [v.good, v.poor, [225, 150, 40]], [v.poor, v.max, [200, 70, 55]]].forEach(([a, b, col]) => {
                c.strokeStyle = rgba(col, 0.75);
                c.lineWidth = R * 0.16;
                c.beginPath();
                c.arc(cx, cy, R, from + span * a / v.max, from + span * b / v.max);
                c.stroke();
            });
            const value = state.vitals[v.id];
            const available = v.always || state.supported[v.id];
            // L'aiguille glisse vers la nouvelle valeur.
            const target = value === null ? 0 : Math.min(v.max, value);
            shownVital[v.id] = calm ? target : (shownVital[v.id] || 0) + (target - (shownVital[v.id] || 0)) * 0.08;
            const ang = from + span * shownVital[v.id] / v.max;
            if (value !== null) {
                c.strokeStyle = INK;
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(cx, cy);
                c.lineTo(cx + Math.cos(ang) * R * 0.92, cy + Math.sin(ang) * R * 0.92);
                c.stroke();
                c.fillStyle = GOLD;
                c.beginPath();
                c.arc(cx, cy, 4, 0, 6.283);
                c.fill();
            }
            c.textAlign = 'center';
            c.fillStyle = INK;
            c.font = font(Math.max(11, R * 0.24), 600);
            c.fillText(value !== null ? v.fmt(value) : available ? 'en attente' : 'indisponible', cx, cy + R * 0.5);
            c.fillStyle = MUTED;
            c.font = font(Math.max(9, Math.min(11, R * 0.17)));
            c.fillText(v.label, cx, cy - R - 8 < 10 ? cy + R * 0.78 : cy - R - 8);
        });
    }
    function textVitals() {
        const legend = board.querySelector('[data-out="vitals"]');
        legend.replaceChildren(...VITALS.map((v) => {
            const value = state.vitals[v.id];
            const li = document.createElement('li');
            let verdict = '';
            if (value !== null) {
                verdict = value <= v.good ? ' : bon' : value <= v.poor ? ' : à améliorer' : ' : mauvais';
            }
            li.textContent = v.label + ' (' + v.id.toUpperCase() + ') : ' + (value !== null ? v.fmt(value) + verdict : (v.always || state.supported[v.id]) ? 'en attente d\'une interaction' : 'non mesuré par ce navigateur');
            return li;
        }));
    }

    // ----- 7. Bilan de la visite : une colonne par page, qui monte comme un histogramme -----
    function visitData() {
        const visit = readVisit();
        if (!visit.length || visit[visit.length - 1].path !== location.pathname) {
            const s = summary();
            visit.push({ path: location.pathname, title: 'Supervision (en cours)', transfer: s.transfer, decoded: s.decoded, requests: s.requests, cached: s.cached });
        }
        return visit.slice(-24);
    }
    function drawVisit() {
        const ch = charts.visit;
        if (!ch) {
            return;
        }
        const c = begin(ch);
        const { w, h } = ch;
        const visit = visitData();
        const max = Math.max(1, ...visit.map((v) => Math.max(v.transfer, v.decoded)));
        const left = 8, bottom = h - 22, top = 12;
        const slot = (w - left * 2) / Math.max(6, visit.length);
        const grow = ease((age() - 0.5) / 1.4);
        visit.forEach((v, i) => {
            const x = left + i * slot + slot * 0.2, bw = slot * 0.6;
            // Contenu total (clair) et part réellement transférée (or).
            const hd = (v.decoded / max) * (bottom - top) * grow;
            const ht = (v.transfer / max) * (bottom - top) * grow;
            c.fillStyle = 'rgba(150, 150, 145, 0.28)';
            c.fillRect(x, bottom - hd, bw, hd);
            c.fillStyle = rgba([200, 149, 47], 0.9);
            c.fillRect(x + bw * 0.2, bottom - ht, bw * 0.6, ht);
            c.fillStyle = MUTED;
            c.font = font(9);
            c.textAlign = 'center';
            const name = v.path.replace(/\/$/, '').split('/').pop() || 'accueil';
            c.fillText(name.slice(0, Math.max(4, Math.floor(slot / 6))), x + bw / 2, h - 8);
        });
        c.strokeStyle = LINE;
        c.beginPath();
        c.moveTo(left, bottom + 0.5);
        c.lineTo(w - left, bottom + 0.5);
        c.stroke();
    }
    function textVisit() {
        const visit = visitData();
        const total = visit.reduce((a, v) => a + v.transfer, 0);
        const decoded = visit.reduce((a, v) => a + v.decoded, 0);
        out('visit-pages', String(visit.length));
        out('visit-total', bytes(total) + ' (contenu ' + bytes(decoded) + ')');
        out('visit-cache', decoded ? Math.max(0, Math.round((1 - total / Math.max(decoded, total)) * 100)) + ' %' : '—');
        const cn = navigator.connection;
        const cores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' cœurs' : '';
        out('network', cn && cn.effectiveType ? cn.effectiveType.toUpperCase() + (cn.downlink ? ', ' + cn.downlink + ' Mbit/s' : '') + (cn.rtt ? ', ' + cn.rtt + ' ms' : '') : 'type non communiqué par ce navigateur' + (cores ? ' · ' + cores : ''));
        let local = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                local += k.length + (localStorage.getItem(k) || '').length;
            }
        } catch (e) {
            local = 0;
        }
        out('storage', bytes(local * 2) + ' de réglages');
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then((est) => out('storage', bytes(local * 2) + ' de réglages · ' + bytes(est.usage || 0) + ' au total'));
        }
    }

    // ----- Boucle -----
    function textAll() {
        typeSummary = textFlux();
        textChrono();
        textFps();
        textVitals();
        textVisit();
    }
    afterLoad(() => {
        textAll();
        if (calm) {
            redraw();
        }
    });
    typeSummary = summary();
    function redraw() {
        drawFlux();
        drawTypes();
        drawChrono();
        drawPing();
        drawFps();
        drawVitals();
        drawVisit();
    }
    ping();
    setInterval(ping, 2000);
    setInterval(() => {
        textFlux();
        textFps();
        textVitals();
        if (calm) {
            redraw();
        }
    }, 1000);
    window.addEventListener('resize', redraw);
    if (calm) {
        redraw();
    } else {
        const loop = (now) => {
            countFrame(now);
            redraw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}());
