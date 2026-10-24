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

    // ----- Le Radiant Prime en 3D (canvas, sans bibliothèque) -----
    // Icosaèdre transparent fait de fils d'or pailletés : treillis intérieur (dodécaèdre et
    // icosaèdre imbriqués, cordes en étoile entre les sommets), petit cristal blanc au cœur qui pulse. Création originale d'après la forme
    // géométrique du Radiant ; le rendu 3D est calculé à la main (rotation + perspective).
    const PHI = (1 + Math.sqrt(5)) / 2;
    const ICO_VERTS = [
        [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
        [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
        [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
    ].map((v) => { const l = Math.hypot(v[0], v[1], v[2]); return v.map((c) => c / l); });
    const ICO_FACES = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    const scale = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
    const mid = (...vs) => { const m = [0, 0, 0]; vs.forEach((v) => { m[0] += v[0] / vs.length; m[1] += v[1] / vs.length; m[2] += v[2] / vs.length; }); return m; };
    const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return scale(v, 1 / l); };
    const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

    // Arêtes de l'icosaèdre (chaque paire de sommets partagée par deux faces).
    const ICO_EDGES = [];
    ICO_FACES.forEach((f) => [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]].forEach(([a, b]) => {
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (!ICO_EDGES.some((e) => e.key === key)) {
            ICO_EDGES.push({ key, a, b });
        }
    }));

    // Treillis intérieur : liste de segments [point A, point B, niveau d'apparition 0..1].
    const LATTICE = (() => {
        const lines = [];
        const centroids = ICO_FACES.map((f) => mid(ICO_VERTS[f[0]], ICO_VERTS[f[1]], ICO_VERTS[f[2]]));
        const dodeca = centroids.map((c) => scale(unit(c), 0.6));
        const innerIco = ICO_VERTS.map((v) => scale(v, 0.32));
        // 1. Motif gravé sur chaque face : triangle intérieur relié aux sommets.
        ICO_FACES.forEach((f, i) => {
            const c = centroids[i];
            const tri = f.map((k) => lerp(ICO_VERTS[k], c, 0.45));
            tri.forEach((p, j) => {
                lines.push([p, tri[(j + 1) % 3], 0.1]);
                lines.push([ICO_VERTS[f[j]], p, 0.05]);
                lines.push([p, lerp(ICO_VERTS[f[(j + 1) % 3]], ICO_VERTS[f[(j + 2) % 3]], 0.5), 0.2]);
            });
        });
        // 2. Rayons des sommets vers le dodécaèdre intérieur.
        ICO_FACES.forEach((f, i) => f.forEach((k) => lines.push([ICO_VERTS[k], dodeca[i], 0.3, 'chord'])));
        // 3. Dodécaèdre intérieur (faces voisines reliées).
        ICO_FACES.forEach((f, i) => ICO_FACES.forEach((g, j) => {
            if (j > i && f.filter((k) => g.includes(k)).length === 2) {
                lines.push([dodeca[i], dodeca[j], 0.45, 'chord']);
            }
        }));
        // 4. Icosaèdre intérieur et liaisons vers le dodécaèdre.
        ICO_EDGES.forEach((e) => lines.push([innerIco[e.a], innerIco[e.b], 0.6, 'chord']));
        ICO_FACES.forEach((f, i) => f.forEach((k) => lines.push([dodeca[i], innerIco[k], 0.7, 'chord'])));
        // 5. Fines branches vers le cœur.
        innerIco.forEach((v) => lines.push([v, scale(v, 0.12), 0.85, 'chord']));
        // 6. Cordes en étoile : chaque sommet relié aux sommets non voisins, à travers le volume.
        ICO_VERTS.forEach((v, i) => ICO_VERTS.forEach((u, j) => {
            if (j > i && !ICO_EDGES.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i)) && Math.hypot(v[0] + u[0], v[1] + u[1], v[2] + u[2]) > 0.2) {
                lines.push([v, u, 0.15, 'chord']);
            }
        }));
        // Paillettes : quelques grains brillants posés le long de chaque fil.
        lines.forEach((line) => { line[4] = [Math.random(), Math.random(), Math.random()]; line[5] = Math.random() * 6.28; });
        return lines;
    })();

    // Crée un Radiant dans un canvas. options : size (px), level (0..1 éclat du cœur et du treillis),
    // speed (rotation), static (une seule image), chords (fils qui traversent le volume : rayons,
    // solides imbriqués et cordes en étoile).
    function radiantPrime(options) {
        const opts = Object.assign({ size: 200, level: 1, speed: 1, static: false, observe: true, chords: true }, options);
        const canvas = document.createElement('canvas');
        canvas.className = 'radiant-prime';
        canvas.setAttribute('aria-hidden', 'true');
        const ctx2d = canvas.getContext('2d');
        let size = opts.size;
        let dpr = 1;
        function resize(px) {
            size = px;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(size * dpr);
            canvas.height = Math.round(size * dpr);
            canvas.style.width = size + 'px';
            canvas.style.height = size + 'px';
        }
        resize(size);

        let level = opts.level;
        let target = opts.level;
        let fade = 0;
        let time = 0;
        let last = 0;
        let visible = true;
        let frame = 0;

        function draw() {
            const c = ctx2d;
            const w = size;
            const R = w * 0.36;
            const cx = w / 2;
            const cy = w / 2;
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, w, w);
            const yaw = time * 0.25 * opts.speed;
            const pitch = 0.35 + Math.sin(time * 0.17 * opts.speed) * 0.25;
            const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
            const project = (v) => {
                const x1 = v[0] * cyw + v[2] * syw;
                const z1 = -v[0] * syw + v[2] * cyw;
                const y2 = v[1] * cp - z1 * sp;
                const z2 = v[1] * sp + z1 * cp;
                const k = 3.2 / (3.2 + z2);
                return [cx + x1 * R * k, cy - y2 * R * k, z2];
            };
            const P = ICO_VERTS.map(project);
            const pulse = 0.85 + 0.15 * Math.sin(time * 1.6);
            const glow = level * pulse;

            // Halo doré derrière l'objet : la lumière du cœur qui baigne la pièce.
            const halo = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.7);
            halo.addColorStop(0, 'rgba(255, 205, 120, ' + (0.5 * glow) + ')');
            halo.addColorStop(0.45, 'rgba(255, 214, 140, ' + (0.18 * glow) + ')');
            halo.addColorStop(1, 'rgba(255, 214, 140, 0)');
            c.fillStyle = halo;
            c.fillRect(0, 0, w, w);

            // Structure transparente en fils d'or : les fils du fond sont plus fins et plus pâles.
            // Les segments sont regroupés par niveau d'apparition et par profondeur (fluidité).
            c.lineCap = 'round';
            const thin = Math.max(0.6, w / 360);
            const groups = new Map();
            const grains = [];
            LATTICE.forEach(([A, B, at, kind, seeds, tw]) => {
                if (kind === 'chord' && !opts.chords) {
                    return;
                }
                const a = project(A), b = project(B);
                const zMid = (a[2] + b[2]) / 2;
                if (!opts.chords && zMid > 0) {
                    // Sans fils intérieurs, seul le motif des faces avant reste visible à travers l'objet.
                    return;
                }
                const bucket = zMid > 0.25 ? 0 : zMid > -0.25 ? 1 : 2;
                const key = at + '|' + bucket;
                if (!groups.has(key)) {
                    groups.set(key, { at, bucket, pts: [] });
                }
                groups.get(key).pts.push(a, b);
                const show = Math.min(1, Math.max(0, (fade - at) / 0.25));
                if (show > 0) {
                    seeds.forEach((t, n) => grains.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, bucket, show, tw + n * 2.1]));
                }
            });
            groups.forEach(({ at, bucket, pts }) => {
                const show = Math.min(1, Math.max(0, (fade - at) / 0.25));
                const depth = [0.45, 0.7, 1][bucket];
                c.strokeStyle = 'rgba(176, 122, 34, ' + (depth * (0.25 + 0.6 * show * (0.4 + 0.6 * glow))).toFixed(3) + ')';
                c.lineWidth = thin * (0.7 + 0.5 * depth);
                c.beginPath();
                for (let i = 0; i < pts.length; i += 2) {
                    c.moveTo(pts[i][0], pts[i][1]);
                    c.lineTo(pts[i + 1][0], pts[i + 1][1]);
                }
                c.stroke();
            });
            // Arêtes extérieures : fils d'or plus épais, qui dessinent la silhouette.
            ICO_EDGES.forEach((e) => {
                const a = P[e.a], b = P[e.b];
                const front = (a[2] + b[2]) < 0.2;
                c.strokeStyle = front ? 'rgba(196, 140, 44, 0.95)' : 'rgba(176, 125, 45, 0.5)';
                c.lineWidth = front ? Math.max(1.2, w / 150) : Math.max(0.8, w / 260);
                c.beginPath();
                c.moveTo(a[0], a[1]);
                c.lineTo(b[0], b[1]);
                c.stroke();
            });
            // Paillettes qui scintillent sur les fils.
            const gs = Math.max(1, w / 170);
            for (const g of grains) {
                const twinkle = 0.5 + 0.5 * Math.sin(time * 3 + g[4]);
                c.globalAlpha = Math.min(1, g[3] * twinkle * [0.5, 0.75, 1][g[2]]);
                c.fillStyle = twinkle > 0.85 ? '#fff6dc' : '#e0a83c';
                c.fillRect(g[0] - gs / 2, g[1] - gs / 2, gs, gs);
            }
            c.globalAlpha = 1;

            // Cœur : un petit cristal blanc éblouissant, entouré d'une aura dorée.
            if (glow > 0.02) {
                const aura = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
                aura.addColorStop(0, 'rgba(255, 252, 240, ' + Math.min(1, glow) + ')');
                aura.addColorStop(0.2, 'rgba(255, 236, 180, ' + (0.9 * glow) + ')');
                aura.addColorStop(0.55, 'rgba(250, 190, 90, ' + (0.4 * glow) + ')');
                aura.addColorStop(1, 'rgba(250, 180, 70, 0)');
                c.fillStyle = aura;
                c.beginPath();
                c.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
                c.fill();
                // Cristal du cœur : un cube vu en biais, qui tourne avec l'objet.
                const k = R * 0.1 * (0.85 + 0.25 * glow);
                const cube = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]
                    .map((v) => project(scale(v, k / R)));
                const hull = [0, 1, 5, 6, 7, 3].map((n) => cube[n]);
                c.fillStyle = 'rgba(255, 255, 250, ' + Math.min(1, 0.6 + 0.5 * glow) + ')';
                c.beginPath();
                hull.forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
                c.closePath();
                c.fill();
                // Éclats en étoile.
                c.strokeStyle = 'rgba(255, 250, 225, ' + (0.7 * glow) + ')';
                c.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const ang = i * Math.PI / 4 + time * 0.2;
                    const len = R * (0.22 + 0.08 * Math.sin(time * 2 + i)) * glow;
                    c.beginPath();
                    c.moveTo(cx, cy);
                    c.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
                    c.stroke();
                }
            }
        }

        function loop(now) {
            frame = 0;
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
            last = now;
            time += dt;
            level += (target - level) * Math.min(1, dt * 2.5);
            if (target > 0.3) {
                fade = Math.min(1.3, fade + dt * 0.55);
            }
            draw();
            if (visible) {
                frame = requestAnimationFrame(loop);
            }
        }

        if (opts.static) {
            fade = 1.3;
            time = 1.2;
            draw();
        } else {
            fade = opts.level > 0.3 ? 1.3 : 0.2;
            frame = requestAnimationFrame(loop);
            // Pause quand le Radiant n'est pas à l'écran.
            if (opts.observe && 'IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    visible = entries[0].isIntersecting;
                    if (visible && !frame) {
                        last = 0;
                        frame = requestAnimationFrame(loop);
                    }
                }).observe(canvas);
            }
        }

        return {
            canvas,
            resize: (px) => { resize(px); if (opts.static) { draw(); } },
            // Éveil : le cœur s'allume et le treillis s'illumine progressivement.
            wake(level0) {
                target = level0 === undefined ? 1 : level0;
                fade = Math.min(fade, 0.2);
                if (!frame && !opts.static) {
                    last = 0;
                    frame = requestAnimationFrame(loop);
                }
            },
        };
    }


    // ----- Poussière du Radiant -----
    // Teintes soutenues pour rester visibles sur l'ivoire de la pièce. L'or et l'argent dominent ;
    // le bleu, le rouge, le vert, le violet et l'orange ne sont que de rares touches.
    const DUST = [
        [200, 140, 30, 0.50],    // or
        [120, 132, 152, 0.40],   // argent
        [50, 110, 200, 0.03],    // bleu
        [205, 55, 60, 0.0175],   // rouge
        [30, 150, 95, 0.0175],   // vert
        [130, 70, 205, 0.0175],  // violet
        [232, 120, 25, 0.0175],  // orange
    ];
    function dustColour() {
        let r = Math.random();
        for (const col of DUST) {
            if ((r -= col[3]) <= 0) {
                return col;
            }
        }
        return DUST[0];
    }
    const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const mix = (a, b, f) => a + (b - a) * f;

    // Points de la page visible : les lignes de texte (dans leur couleur) et le contour des panneaux (en or).
    // Ils servent à dissoudre la page en particules, ou à la recomposer à partir d'elles.
    function samplePage(count) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const zones = [];
        const range = document.createRange();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => (node.textContent.trim() && !node.parentElement.closest('.radiant-intro, .fondation-scene, script, style, .sound-toggle, .skip-link')
                ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
        });
        while (walker.nextNode()) {
            range.selectNodeContents(walker.currentNode);
            const rgb = (getComputedStyle(walker.currentNode.parentElement).color.match(/\d+/g) || [21, 25, 37]).slice(0, 3).map(Number);
            for (const r of range.getClientRects()) {
                if (r.width > 2 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw) {
                    zones.push({ x: r.left, y: r.top + r.height * 0.2, w: r.width, h: r.height * 0.6, col: rgb, weight: r.width * r.height * 0.6 });
                }
            }
        }
        document.querySelectorAll('.card, .competence, .hero, .facts, .radiant-nodes a, .button, .header-inner').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 2 && r.bottom > 0 && r.top < vh) {
                zones.push({ x: r.left, y: r.top, w: r.width, h: r.height, edge: true, col: [200, 149, 47], weight: (r.width + r.height) * 6 });
            }
        });
        if (!zones.length) {
            return [];
        }
        let total = 0;
        const cumul = zones.map((z) => (total += z.weight));
        const points = [];
        for (let i = 0; i < count; i++) {
            const pick = Math.random() * total;
            let lo = 0, hi = cumul.length - 1;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                if (cumul[mid] < pick) { lo = mid + 1; } else { hi = mid; }
            }
            const z = zones[lo];
            let x = z.x + Math.random() * z.w, y = z.y + Math.random() * z.h;
            if (z.edge) {
                // Un point sur le contour du panneau.
                const side = Math.random() * (z.w + z.h) * 2;
                if (side < z.w) { y = z.y; } else if (side < z.w * 2) { y = z.y + z.h; } else { x = Math.random() < 0.5 ? z.x : z.x + z.w; }
            }
            points.push({ x, y, col: z.col });
        }
        return points;
    }

    function dustCanvas(className) {
        const canvas = document.createElement('canvas');
        canvas.className = className;
        canvas.setAttribute('aria-hidden', 'true');
        const state = { canvas, c: canvas.getContext('2d'), w: 0, h: 0, dpr: 1 };
        state.resize = () => {
            state.dpr = Math.min(window.devicePixelRatio || 1, 2);
            state.w = window.innerWidth;
            state.h = window.innerHeight;
            canvas.width = Math.round(state.w * state.dpr);
            canvas.height = Math.round(state.h * state.dpr);
        };
        state.resize();
        return state;
    }
    function dot(c, x, y, size, col, alpha) {
        c.fillStyle = 'rgba(' + Math.round(col[0]) + ',' + Math.round(col[1]) + ',' + Math.round(col[2]) + ',' + alpha.toFixed(3) + ')';
        if (size > 2) {
            // Étoiles brillantes : un point rond entouré d'un halo doux.
            c.beginPath();
            c.arc(x, y, size * 0.45, 0, 6.283);
            c.fill();
            c.globalAlpha = 0.2;
            c.beginPath();
            c.arc(x, y, size * 1.3, 0, 6.283);
            c.fill();
            c.globalAlpha = 1;
        } else {
            c.fillRect(x - size / 2, y - size / 2, size, size);
        }
    }

    // Réseau du Radiant (introduction complète) : une sphère de verre maillée enveloppe le Radiant ;
    // un filet de poussière monte du cœur, puis des filaments dorés relient des points répartis
    // dans la sphère, comme une toile cosmique.
    function radiantWeb() {
        const rnd = (a, b) => a + Math.random() * (b - a);
        const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        // Maille de la sphère : points répartis régulièrement (spirale de Fibonacci).
        const mesh = [];
        const meshCount = window.innerWidth < 760 ? 420 : 900;
        for (let i = 0; i < meshCount; i++) {
            const y = 1 - (2 * (i + 0.5)) / meshCount;
            const r = Math.sqrt(1 - y * y);
            const a = i * 2.39996;
            mesh.push([Math.cos(a) * r, y, Math.sin(a) * r]);
        }
        // Nœuds répartis en couronne dans la moitié haute de la sphère.
        const nodes = [];
        const nodeCount = 8;
        for (let i = 0; i < nodeCount; i++) {
            const a = (i / nodeCount) * 6.283 + rnd(-0.25, 0.25);
            const r = rnd(0.55, 0.85);
            const y = rnd(-0.15, 0.6);
            nodes.push({ p: [Math.cos(a) * r, y, Math.sin(a) * r] });
        }
        // Filaments : une chaîne qui fait le tour, deux liaisons transverses, et le filet qui monte du cœur.
        const links = [[-1, 0]];
        for (let i = 0; i < nodeCount - 1; i++) {
            links.push([i, i + 1]);
        }
        links.push([1, 5], [3, 7]);
        const FIL = [[200, 140, 30], [214, 160, 60], [120, 132, 152], [40, 160, 150]];
        const edges = links.map(([a, b], index) => {
            const A = a < 0 ? [0, -0.05, 0] : nodes[a].p;
            const B = nodes[b].p;
            // Point de contrôle poussé vers la paroi : le filament épouse la courbure de la sphère.
            const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
            const len = Math.hypot(M[0], M[1], M[2]) || 1;
            const push = a < 0 ? 1 : 0.92 / len;
            const C = [M[0] * push + gauss() * 0.15, M[1] * push + gauss() * 0.15, M[2] * push + gauss() * 0.15];
            const grains = [];
            const n = a < 0 ? 220 : 420;
            for (let i = 0; i < n; i++) {
                const r = Math.random();
                grains.push({
                    u: Math.random(), speed: rnd(0.04, 0.14), tw: Math.random() * 6.28,
                    off: [gauss() * 0.05, gauss() * 0.05, gauss() * 0.05],
                    col: r < 0.68 ? FIL[0] : r < 0.8 ? FIL[1] : r < 0.92 ? FIL[2] : FIL[3],
                    size: Math.random() < 0.06 ? 2.2 : rnd(0.6, 1.4),
                });
            }
            return { A, B, C, a, b, grains, start: 0.32 + index * 0.022 };
        });
        const bez = (e, u, i) => (1 - u) * (1 - u) * e.A[i] + 2 * (1 - u) * u * e.C[i] + u * u * e.B[i];

        return function draw(c, cx, cy, R, sec, k, fade) {
            const appear = ease((k - 0.28) / 0.1) * fade;
            if (appear <= 0) {
                return;
            }
            const Rw = R * 1.08;
            const yaw = sec * 0.06;
            const tilt = 0.22;
            const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
            const out = [0, 0, 0];
            const project = (x, y, z) => {
                const rx = x * cyw - z * syw;
                const rz = x * syw + z * cyw;
                const y2 = y * ct - rz * st;
                const z2 = y * st + rz * ct;
                const persp = 2.6 / (2.6 + z2);
                out[0] = cx + rx * Rw * persp;
                out[1] = cy - y2 * Rw * persp;
                out[2] = z2;
                return out;
            };
            // Paroi de verre : contour argenté, maille plus visible sur les bords.
            c.strokeStyle = 'rgba(150, 160, 178, ' + (0.35 * appear).toFixed(3) + ')';
            c.lineWidth = 1;
            c.beginPath();
            c.arc(cx, cy, Rw * 0.985, 0, 6.283);
            c.stroke();
            for (const m of mesh) {
                const q = project(m[0], m[1], m[2]);
                const rim = 1 - Math.abs(q[2]);
                const alpha = (0.14 + 0.6 * rim * rim) * appear * (q[2] > 0 ? 0.6 : 1);
                c.fillStyle = 'rgba(120, 132, 152, ' + alpha.toFixed(3) + ')';
                c.fillRect(q[0] - 0.75, q[1] - 0.75, 1.5, 1.5);
            }
            // Filaments de poussière qui coulent d'un nœud à l'autre.
            for (const e of edges) {
                const grow = ease((k - e.start) / 0.09);
                if (grow <= 0) {
                    continue;
                }
                // Âme du filament : un trait doré léger sous la poussière.
                c.strokeStyle = 'rgba(200, 145, 40, ' + (0.4 * appear).toFixed(3) + ')';
                c.lineWidth = 1.2;
                c.beginPath();
                for (let i = 0; i <= 28; i++) {
                    const u = (i / 28) * grow;
                    const q = project(bez(e, u, 0), bez(e, u, 1), bez(e, u, 2));
                    if (i === 0) { c.moveTo(q[0], q[1]); } else { c.lineTo(q[0], q[1]); }
                }
                c.stroke();
                for (const g of e.grains) {
                    const u = (g.u + sec * g.speed) % 1;
                    if (u > grow) {
                        continue;
                    }
                    const thick = Math.sin(u * 3.1416) + 0.25;
                    const q = project(bez(e, u, 0) + g.off[0] * thick, bez(e, u, 1) + g.off[1] * thick, bez(e, u, 2) + g.off[2] * thick);
                    const twinkle = 0.55 + 0.45 * Math.sin(sec * 5 + g.tw);
                    dot(c, q[0], q[1], g.size, g.col, twinkle * appear * 0.95);
                }
            }
        };
    }

    // ----- Ouverture du Radiant : jaillissement de particules qui forment une galaxie -----
    // Introduction complète : les particules sortent du cœur en spirale, s'organisent en galaxie
    // aérée à bras spiraux entourée d'une sphère de poussière, tournent comme une vraie galaxie
    // (plus vite au centre), puis envahissent la pièce.
    // Changement de page (arrive) : la page quittée revient en poussière depuis le cœur, forme la
    // galaxie, puis les particules vont se poser sur les textes et panneaux de la nouvelle page.
    // Les étapes sont exprimées en fraction de la durée de l'introduction.
    function radiantGalaxy(total, arrive) {
        const s = dustCanvas('radiant-galaxy' + (arrive ? ' free' : ''));
        const { canvas, c } = s;
        const small = window.innerWidth < 760;
        const count = small ? 2800 : 7000;
        const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const parts = [];
        for (let i = 0; i < count; i++) {
            const kind = Math.random();
            const p = { col: dustColour(), size: Math.random() < 0.05 ? 2.3 : 0.5 + Math.random() * 0.9, tw: Math.random() * 6.28 };
            if (kind < 0.66) {
                // Bras spiraux (galaxie à 3 bras), larges et espacés.
                const arm = Math.floor(Math.random() * 3);
                p.r = 0.1 + Math.random() * 1.2;
                p.a = arm * 2.094 + p.r * 3.8 + gauss() * 0.5;
                p.y = gauss() * 0.12;
            } else if (kind < 0.78) {
                // Bulbe central, peu dense.
                p.r = 0.04 + Math.abs(gauss()) * 0.3;
                p.a = Math.random() * 6.28;
                p.y = gauss() * 0.16;
            } else {
                // Sphère de poussière, épaisse et clairsemée, qui enveloppe la galaxie.
                const u = Math.random() * 2 - 1;
                const shell = 1 + Math.random() * 0.9;
                p.sphere = true;
                p.r = Math.sqrt(1 - u * u) * shell;
                p.a = Math.random() * 6.28;
                p.y = u * shell;
            }
            p.emit = arrive ? Math.random() * 0.06 : 0.15 + Math.pow(Math.random(), 1.4) * 0.32;   // moment où la particule est projetée
            p.flight = arrive ? 0.1 + Math.random() * 0.12 : 0.07 + Math.random() * 0.09;
            p.swirl = 0.4 + Math.random() * 0.8;     // léger enroulement pendant le vol
            p.land = 0.15 + Math.random() * 0.4;     // (arrivée) départ vers la page, échelonné pour un mouvement continu
            parts.push(p);
        }
        let targets = null;
        const web = arrive ? null : radiantWeb();

        window.addEventListener('resize', s.resize);
        let t0 = 0;
        let frame = 0;
        function draw(now) {
            if (!t0) {
                t0 = now;
            }
            const { w, h, dpr } = s;
            const sec = (now - t0) / 1000;
            const k = sec / total;                       // avancement 0..1
            if (arrive && !targets && k > 0.1) {
                const points = samplePage(Math.round(count * 0.75));
                targets = parts.map((p, i) => points[i] || null);
            }
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, w, h);
            const cx = w / 2, cy = h / 2;
            const base = Math.min(w, h) * 0.46;
            // Taille de la galaxie : elle grandit puis envahit la pièce à la fin de l'introduction complète.
            const R = base * (arrive ? 1 : 1 + 2.2 * ease((k - 0.72) / 0.2));
            const tilt = 1.05 - 0.35 * ease((k - 0.4) / 0.4);      // le disque se redresse
            const yaw = sec * 0.12;
            const ct = Math.cos(tilt), st = Math.sin(tilt);
            const fadeOut = arrive ? 1 : 1 - ease((k - 0.86) / 0.08);
            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                const life = (k - p.emit) / p.flight;
                if (life <= 0) {
                    continue;
                }
                // Projection depuis le cœur : la particule part du centre comme un rayon de lumière,
                // très vite d'abord puis en ralentissant jusqu'à sa place dans la galaxie.
                const f = life >= 1 ? 1 : 1 - Math.pow(1 - life, 3);
                // Rotation différentielle : le centre tourne plus vite que le bord.
                const spin = p.sphere ? sec * 0.08 : sec * (0.5 / (0.25 + p.r));
                const ang = p.a + spin + (1 - f) * p.swirl;
                const rad = p.r * f;
                const lift = p.y * f;
                if (life < 1) {
                    // Traînée lumineuse tournée vers le cœur : on voit d'où la particule est projetée.
                    const back = f * 0.7;
                    const bx = Math.cos(ang + yaw) * p.r * back;
                    const bz0 = Math.sin(ang + yaw) * p.r * back;
                    const by = p.y * back * ct - bz0 * st;
                    const bp = 2.4 / (2.4 + p.y * back * st + bz0 * ct);
                    const hx = Math.cos(ang + yaw) * rad, hz0 = Math.sin(ang + yaw) * rad;
                    const hp = 2.4 / (2.4 + lift * st + hz0 * ct);
                    c.strokeStyle = 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',' + (0.35 * (1 - life) * fadeOut).toFixed(3) + ')';
                    c.lineWidth = 0.8;
                    c.beginPath();
                    c.moveTo(cx + bx * R * bp, cy - by * R * bp);
                    c.lineTo(cx + hx * R * hp, cy - (lift * ct - hz0 * st) * R * hp);
                    c.stroke();
                }
                const x = Math.cos(ang + yaw) * rad;
                const z0 = Math.sin(ang + yaw) * rad;
                const y = lift * ct - z0 * st;
                const z = lift * st + z0 * ct;
                const persp = 2.4 / (2.4 + z);
                let px = cx + x * R * persp;
                let py = cy - y * R * persp;
                let col = p.col;
                let size = p.size * persp * (0.35 + 0.65 * f) * (arrive ? 2 : 1 + 1.5 * ease((k - 0.72) / 0.2));
                let fade = fadeOut;
                if (arrive) {
                    // Les particules vont se poser sur la nouvelle page et prennent sa couleur.
                    const target = targets && targets[i];
                    const m = ease((k - p.land) / 0.22);
                    // Posée, la particule s'éteint et laisse place au texte.
                    fade *= 1 - ease((k - p.land - 0.2) / 0.12);
                    if (target) {
                        px = mix(px, target.x, m);
                        py = mix(py, target.y, m);
                        col = [mix(col[0], target.col[0], m), mix(col[1], target.col[1], m), mix(col[2], target.col[2], m)];
                        size = mix(size, 1.4, m);
                    } else {
                        fade *= 1 - m;
                    }
                }
                if (px < -10 || py < -10 || px > w + 10 || py > h + 10) {
                    continue;
                }
                const twinkle = 0.6 + 0.4 * Math.sin(sec * 3 + p.tw);
                dot(c, px, py, size, col, Math.min(1, life * 2) * twinkle * fade * (0.6 + 0.4 * persp));
            }
            if (web) {
                web(c, cx, cy, R, sec, k, fadeOut);
            }
            // Faisceaux du projecteur : pendant l'émission, des rayons fins partent du cœur.
            const beam = arrive ? 1 - ease(k / 0.25) : ease((k - 0.13) / 0.05) * (1 - ease((k - 0.42) / 0.12));
            if (beam > 0) {
                c.lineWidth = 1;
                for (let i = 0; i < 28; i++) {
                    const a = i * 0.2244 + sec * 0.3;
                    const flick = 0.5 + 0.5 * Math.sin(sec * 9 + i * 2.1);
                    const len = R * (0.35 + 0.5 * flick);
                    const g = c.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
                    g.addColorStop(0, 'rgba(255, 205, 110, ' + (0.45 * beam * flick).toFixed(3) + ')');
                    g.addColorStop(1, 'rgba(255, 205, 110, 0)');
                    c.strokeStyle = g;
                    c.beginPath();
                    c.moveTo(cx, cy);
                    c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
                    c.stroke();
                }
            }
            // Lueur du noyau galactique.
            const glow = (arrive ? 1 - ease((k - 0.15) / 0.35) : ease((k - 0.2) / 0.2)) * fadeOut;
            if (glow > 0) {
                const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
                g.addColorStop(0, 'rgba(255, 214, 140, ' + (0.55 * glow) + ')');
                g.addColorStop(1, 'rgba(255, 214, 140, 0)');
                c.fillStyle = g;
                c.fillRect(cx - R, cy - R, R * 2, R * 2);
            }
            if (k < 1) {
                frame = requestAnimationFrame(draw);
            }
        }
        return {
            canvas,
            start() { frame = requestAnimationFrame(draw); },
            stop() { cancelAnimationFrame(frame); window.removeEventListener('resize', s.resize); canvas.remove(); },
        };
    }

    // ----- Départ vers une autre page : la page se dissout en poussière que le Radiant absorbe -----
    function dissolvePage(href) {
        const s = dustCanvas('page-dust');
        const { c, w, h, dpr } = s;
        const points = samplePage(window.innerWidth < 760 ? 1800 : 4200);
        const cx = w / 2, cy = h / 2;
        // La page se change en poussière qui, sans s'arrêter, gonfle légèrement puis tourbillonne vers le cœur.
        const duration = 0.85;
        const parts = points.map((pt) => {
            const dx = pt.x - cx, dy = pt.y - cy;
            return {
                r: Math.hypot(dx, dy), a: Math.atan2(dy, dx), from: pt.col, to: dustColour(),
                delay: Math.random() * 0.12, burst: 20 + Math.random() * 50, orbit: 6 + Math.random() * 28, swirl: (1.2 + Math.random() * 2) * (Math.random() < 0.5 ? -1 : 1),
                size: Math.random() < 0.06 ? 2.6 : 1 + Math.random() * 1.2, tw: Math.random() * 6.28,
            };
        });
        document.body.appendChild(s.canvas);
        root.classList.add('leaving');
        let t0 = 0;
        function draw(now) {
            if (!t0) {
                t0 = now;
            }
            const sec = (now - t0) / 1000;
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, w, h);
            for (const p of parts) {
                const m = Math.max(0, Math.min(1, (sec - p.delay) / (duration - 0.2)));
                const pull = m * m * m;   // accélère en approchant du cœur
                // Spirale vers le cœur du Radiant, au centre de l'écran, après une brève poussée vers l'extérieur.
                // Arrivée au cœur, elle continue de tourner sur une petite orbite.
                const rad = p.r * (1 - pull) + p.burst * Math.sin(Math.min(1, m * 2) * 3.1416) * (1 - pull) + p.orbit * pull;
                const ang = p.a + p.swirl * pull + sec * 4 * pull;
                const colour = [mix(p.from[0], p.to[0], ease(m * 1.6)), mix(p.from[1], p.to[1], ease(m * 1.6)), mix(p.from[2], p.to[2], ease(m * 1.6))];
                const twinkle = 0.7 + 0.3 * Math.sin(sec * 8 + p.tw);
                dot(c, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, mix(1.3, p.size, ease(m * 2)), colour, ease(sec / 0.08) * twinkle * (1 - 0.6 * ease((m - 0.85) / 0.15)));
            }
            const glow = ease((sec - 0.35) / 0.45);
            if (glow > 0) {
                const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.18);
                g.addColorStop(0, 'rgba(255, 214, 140, ' + (0.7 * glow) + ')');
                g.addColorStop(1, 'rgba(255, 214, 140, 0)');
                c.fillStyle = g;
                c.fillRect(0, 0, w, h);
            }
            // L'animation continue pendant le chargement de la page suivante : aucun temps d'arrêt.
            if (!left && sec > duration - 0.3) {
                left = true;
                location.href = href;
            }
            requestAnimationFrame(draw);
        }
        let left = false;
        requestAnimationFrame(draw);
        // Retour arrière depuis le cache du navigateur : la page réapparaît intacte.
        window.addEventListener('pageshow', () => { root.classList.remove('leaving'); s.canvas.remove(); }, { once: true });
    }

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
    // Le Radiant au centre d'une scène : un canvas 3D, ou rien si les animations sont réduites
    // (dans ce cas une image fixe est dessinée).
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('a11y-motion');
    function core(size, level, observe, chords) {
        const r = radiantPrime({ size, level: level === undefined ? 1 : level, static: calm, observe: observe !== false, chords: chords !== false });
        r.canvas.classList.add('radiant-core');
        r.canvas.radiant = r;
        return r.canvas;
    }

    // ----- Le Radiant de l'accueil -----
    const radiant = document.querySelector('.radiant');
    if (radiant) {
        radiant.prepend(sphere('radiant-sphere'), core(window.innerWidth > 760 ? 170 : 130));
    }
    const hero = document.querySelector('.hero');
    if (hero) {
        const heroRadiant = core(170, 0.85);
        heroRadiant.classList.add('hero-radiant');
        hero.appendChild(heroRadiant);
    }

    // Un clic sur le nom ramène à la page de garde : l'introduction complète et son écran d'accueil.
    const brand = document.querySelector('.brand');
    if (brand) {
        brand.addEventListener('click', () => {
            try {
                sessionStorage.removeItem('fondation-intro');
            } catch (e) {
                // Sans stockage de session, l'introduction complète s'affiche de toute façon.
            }
        });
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

    // Passage d'une page à l'autre : la page quittée se dissout en particules que le Radiant absorbe,
    // et la page suivante se recompose à partir de ces particules (voir radiantGalaxy).
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            || link.target === '_blank' || link.hasAttribute('download') || link.origin !== location.origin
            || (link.pathname === location.pathname && link.hash) || root.classList.contains('leaving')) {
            return;
        }
        event.preventDefault();
        dissolvePage(link.href);
    });

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
        // Une fois posé, le panneau réagit au survol sans le délai du déploiement.
        setTimeout(() => el.classList.add('settled'), 2400);
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
    const SHORT = { total: 3, wake: 0.3, rings: [0.1, 0.25, 0.4, 0.55], ringDur: 1.1, outDur: 2.2 };
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
    // Le Radiant de l'introduction n'a aucun fil qui traverse le volume : seulement ses arêtes,
    // le motif gravé sur ses faces et son cœur (choix d'Olivier).
    const introCore = core(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.32), seen ? 1 : 0.15, false, false);
    stage.append(sphere('sphere', T.rings), introCore);
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
    // Entre deux pages, la poussière déborde de l'introduction pour aller se poser sur la page.
    const galaxy = radiantGalaxy(T.total, seen);
    intro.append(stage, title, gate, skip);
    (seen ? document.body : intro).appendChild(galaxy.canvas);
    document.body.appendChild(intro);

    let done = false;
    let running = false;
    function finish() {
        if (done) {
            return;
        }
        done = true;
        galaxy.stop();
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
        introCore.radiant.wake(1);
        galaxy.start();
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
        // Le déploiement de l'interface commence pendant que l'introduction s'efface ;
        // entre deux pages, les deux se fondent l'un dans l'autre.
        setTimeout(start, (T.end + (seen ? -0.3 : 0.1)) * 1000);
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
