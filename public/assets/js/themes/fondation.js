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
    // Icosaèdre de verre ambré, treillis doré intérieur (dodécaèdre et icosaèdre imbriqués,
    // rayons vers les faces), cœur lumineux qui pulse. Création originale d'après la forme
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
        ICO_FACES.forEach((f, i) => f.forEach((k) => lines.push([ICO_VERTS[k], dodeca[i], 0.3])));
        // 3. Dodécaèdre intérieur (faces voisines reliées).
        ICO_FACES.forEach((f, i) => ICO_FACES.forEach((g, j) => {
            if (j > i && f.filter((k) => g.includes(k)).length === 2) {
                lines.push([dodeca[i], dodeca[j], 0.45]);
            }
        }));
        // 4. Icosaèdre intérieur et liaisons vers le dodécaèdre.
        ICO_EDGES.forEach((e) => lines.push([innerIco[e.a], innerIco[e.b], 0.6]));
        ICO_FACES.forEach((f, i) => f.forEach((k) => lines.push([dodeca[i], innerIco[k], 0.7])));
        // 5. Fines branches vers le cœur.
        innerIco.forEach((v) => lines.push([v, scale(v, 0.12), 0.85]));
        return lines;
    })();

    // Crée un Radiant dans un canvas. options : size (px), level (0..1 éclat du cœur et du treillis),
    // speed (rotation), static (une seule image).
    function radiantPrime(options) {
        const opts = Object.assign({ size: 200, level: 1, speed: 1, static: false, observe: true }, options);
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

            // Halo derrière l'objet.
            const halo = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
            halo.addColorStop(0, 'rgba(255, 214, 140, ' + (0.35 * glow) + ')');
            halo.addColorStop(1, 'rgba(255, 214, 140, 0)');
            c.fillStyle = halo;
            c.fillRect(0, 0, w, w);

            // Faces : verre ambré fumé, celles de derrière d'abord.
            const faces = ICO_FACES.map((f) => {
                const a = P[f[0]], b = P[f[1]], d = P[f[2]];
                const facing = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
                return { f, z: (a[2] + b[2] + d[2]) / 3, back: facing > 0 };
            }).sort((m, n) => n.z - m.z);
            const paint = (face) => {
                const [a, b, d] = face.f.map((k) => P[k]);
                c.beginPath();
                c.moveTo(a[0], a[1]);
                c.lineTo(b[0], b[1]);
                c.lineTo(d[0], d[1]);
                c.closePath();
                c.fillStyle = face.back ? 'rgba(46, 32, 14, 0.78)' : 'rgba(150, 105, 35, ' + (0.1 + 0.05 * Math.max(0, -face.z)) + ')';
                c.fill();
            };
            faces.filter((x) => x.back).forEach(paint);

            // Treillis doré intérieur (lumière additive). Les segments sont regroupés par niveau
            // d'apparition et par profondeur pour limiter le nombre de tracés (fluidité).
            c.globalCompositeOperation = 'lighter';
            c.lineCap = 'round';
            c.lineWidth = Math.max(0.8, w / 260);
            const groups = new Map();
            LATTICE.forEach(([A, B, at]) => {
                const a = project(A), b = project(B);
                const bucket = (a[2] + b[2]) < -0.3 ? 0 : (a[2] + b[2]) < 0.4 ? 1 : 2;
                const key = at + '|' + bucket;
                if (!groups.has(key)) {
                    groups.set(key, { at, bucket, pts: [] });
                }
                groups.get(key).pts.push(a, b);
            });
            groups.forEach(({ at, bucket, pts }) => {
                const show = Math.min(1, Math.max(0, (fade - at) / 0.25));
                const depth = [1, 0.75, 0.5][bucket];
                c.strokeStyle = 'rgba(240, 190, 90, ' + (0.85 * depth * (0.35 + 0.65 * show * glow)) + ')';
                c.beginPath();
                for (let i = 0; i < pts.length; i += 2) {
                    c.moveTo(pts[i][0], pts[i][1]);
                    c.lineTo(pts[i + 1][0], pts[i + 1][1]);
                }
                c.stroke();
            });

            // Cœur lumineux.
            if (glow > 0.02) {
                const core = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42 * (0.8 + 0.3 * glow));
                core.addColorStop(0, 'rgba(255, 255, 245, ' + Math.min(1, 1.1 * glow) + ')');
                core.addColorStop(0.18, 'rgba(255, 236, 180, ' + (0.9 * glow) + ')');
                core.addColorStop(0.5, 'rgba(255, 190, 90, ' + (0.35 * glow) + ')');
                core.addColorStop(1, 'rgba(255, 170, 60, 0)');
                c.fillStyle = core;
                c.beginPath();
                c.arc(cx, cy, R * 0.5, 0, Math.PI * 2);
                c.fill();
                // Éclats en étoile.
                c.strokeStyle = 'rgba(255, 245, 210, ' + (0.5 * glow) + ')';
                c.lineWidth = 1;
                for (let i = 0; i < 6; i++) {
                    const ang = i * Math.PI / 3 + time * 0.2;
                    const len = R * (0.18 + 0.06 * Math.sin(time * 2 + i)) * glow;
                    c.beginPath();
                    c.moveTo(cx, cy);
                    c.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
                    c.stroke();
                }
            }
            c.globalCompositeOperation = 'source-over';

            // Faces avant (verre translucide) puis arêtes dorées.
            faces.filter((x) => !x.back).forEach(paint);
            ICO_EDGES.forEach((e) => {
                const a = P[e.a], b = P[e.b];
                const front = (a[2] + b[2]) < 0.2;
                c.strokeStyle = front ? 'rgba(214, 168, 72, 0.95)' : 'rgba(170, 125, 45, 0.55)';
                c.lineWidth = front ? Math.max(1.4, w / 130) : Math.max(1, w / 220);
                c.beginPath();
                c.moveTo(a[0], a[1]);
                c.lineTo(b[0], b[1]);
                c.stroke();
            });
            // Reflet sur le verre.
            const shine = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
            shine.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
            c.fillStyle = shine;
            c.beginPath();
            c.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
            c.fill();
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


    // ----- Ouverture du Radiant : jaillissement de particules qui forment une galaxie -----
    // Les particules (or, argent, bleu, rouge, vert, violet) sortent du cœur en spirale,
    // s'organisent en galaxie à bras spiraux entourée d'une sphère de poussière lumineuse,
    // tournent comme une vraie galaxie (plus vite au centre), puis envahissent la pièce.
    // Les étapes sont exprimées en fraction de la durée de l'introduction.
    function radiantGalaxy(total) {
        const canvas = document.createElement('canvas');
        canvas.className = 'radiant-galaxy';
        canvas.setAttribute('aria-hidden', 'true');
        const c = canvas.getContext('2d');
        const small = window.innerWidth < 760;
        const count = small ? 2400 : 6500;
        const palette = [
            [255, 214, 130, 0.34],   // or
            [235, 238, 245, 0.28],   // argent
            [150, 200, 255, 0.12],   // bleu
            [255, 120, 110, 0.08],   // rouge
            [140, 235, 170, 0.08],   // vert
            [200, 150, 255, 0.10],   // violet
        ];
        const pick = () => {
            let r = Math.random();
            for (const col of palette) {
                if ((r -= col[3]) <= 0) {
                    return col;
                }
            }
            return palette[0];
        };
        const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const parts = [];
        for (let i = 0; i < count; i++) {
            const kind = Math.random();
            const p = { col: pick(), size: Math.random() < 0.1 ? 2.6 : 0.9 + Math.random() * 1.4, tw: Math.random() * 6.28 };
            if (kind < 0.62) {
                // Bras spiraux (galaxie à 3 bras), disque fin.
                const arm = Math.floor(Math.random() * 3);
                const r = Math.pow(Math.random(), 0.7);
                p.r = 0.08 + r * 0.92;
                p.a = arm * 2.094 + p.r * 4.2 + gauss() * 0.35;
                p.y = gauss() * 0.05 * (1.2 - p.r);
            } else if (kind < 0.8) {
                // Bulbe central.
                p.r = Math.abs(gauss()) * 0.22;
                p.a = Math.random() * 6.28;
                p.y = gauss() * 0.12;
            } else {
                // Sphère de poussière qui enveloppe la galaxie.
                const u = Math.random() * 2 - 1;
                p.sphere = true;
                p.r = Math.sqrt(1 - u * u) * 1.15;
                p.a = Math.random() * 6.28;
                p.y = u * 1.15;
            }
            p.emit = 0.17 + Math.random() * 0.2;     // moment où la particule jaillit
            p.flight = 0.12 + Math.random() * 0.1;   // durée du vol jusqu'à sa place
            p.swirl = 2.5 + Math.random() * 2.5;     // tours de spirale pendant le vol
            parts.push(p);
        }

        let w = 0, h = 0, dpr = 1;
        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
        }
        resize();
        window.addEventListener('resize', resize);

        let t0 = 0;
        let frame = 0;
        const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
        function draw(now) {
            if (!t0) {
                t0 = now;
            }
            const sec = (now - t0) / 1000;
            const k = sec / total;                       // avancement 0..1
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, w, h);
            c.globalCompositeOperation = 'lighter';
            const cx = w / 2, cy = h / 2;
            // Taille de la galaxie : elle grandit puis envahit la pièce à la fin.
            const base = Math.min(w, h) * 0.42;
            const R = base * (1 + 2.2 * ease((k - 0.72) / 0.2));
            const tilt = 1.05 - 0.35 * ease((k - 0.4) / 0.4);      // le disque se redresse
            const yaw = sec * 0.12;
            const ct = Math.cos(tilt), st = Math.sin(tilt);
            const fadeOut = 1 - ease((k - 0.86) / 0.08);
            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                const life = (k - p.emit) / p.flight;
                if (life <= 0) {
                    continue;
                }
                const f = ease(life);
                // Rotation différentielle : le centre tourne plus vite que le bord.
                const spin = p.sphere ? sec * 0.08 : sec * (0.5 / (0.25 + p.r));
                const ang = p.a + spin + (1 - f) * p.swirl * 6.28;
                const rad = p.r * f;
                const lift = p.y * f + (1 - f) * Math.sin(life * 3.14) * 0.35;  // arc du jaillissement
                const x = Math.cos(ang + yaw) * rad;
                const z0 = Math.sin(ang + yaw) * rad;
                const y = lift * ct - z0 * st;
                const z = lift * st + z0 * ct;
                const persp = 2.4 / (2.4 + z);
                const px = cx + x * R * persp;
                const py = cy - y * R * persp;
                if (px < -10 || py < -10 || px > w + 10 || py > h + 10) {
                    continue;
                }
                const twinkle = 0.6 + 0.4 * Math.sin(sec * 3 + p.tw);
                const alpha = Math.min(1, life * 2) * twinkle * fadeOut * (0.6 + 0.4 * persp);
                const size = p.size * persp * (1 + 1.5 * ease((k - 0.72) / 0.2));
                c.fillStyle = 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',' + alpha.toFixed(3) + ')';
                if (p.size > 2) {
                    // Étoiles brillantes : un point rond entouré d'un halo doux.
                    c.beginPath();
                    c.arc(px, py, size * 0.45, 0, 6.283);
                    c.fill();
                    c.globalAlpha = 0.2;
                    c.beginPath();
                    c.arc(px, py, size * 1.3, 0, 6.283);
                    c.fill();
                    c.globalAlpha = 1;
                } else {
                    c.fillRect(px - size / 2, py - size / 2, size, size);
                }
            }
            // Lueur du noyau galactique.
            const glow = ease((k - 0.2) / 0.2) * fadeOut;
            if (glow > 0) {
                const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
                g.addColorStop(0, 'rgba(255, 236, 190, ' + (0.45 * glow) + ')');
                g.addColorStop(1, 'rgba(255, 200, 120, 0)');
                c.fillStyle = g;
                c.fillRect(cx - R, cy - R, R * 2, R * 2);
            }
            c.globalCompositeOperation = 'source-over';
            if (k < 1) {
                frame = requestAnimationFrame(draw);
            }
        }
        return {
            canvas,
            start() { frame = requestAnimationFrame(draw); },
            stop() { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); },
        };
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
    function core(size, level, observe) {
        const r = radiantPrime({ size, level: level === undefined ? 1 : level, static: calm, observe: observe !== false });
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
    const introCore = core(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.32), seen ? 1 : 0.15, false);
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
    const galaxy = radiantGalaxy(T.total);
    intro.append(stage, galaxy.canvas, title, gate, skip);
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
