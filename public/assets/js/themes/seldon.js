// Thème « Seldon » : ciel galactique fixe (Fondation) + pluie de caractères (Matrix)
// mêlant katakana et symboles des équations de psychohistoire.
// La pluie est coupée si l'utilisateur demande moins d'animations ou un contraste renforcé ;
// le ciel étoilé reste, car il est immobile.

(function () {
    'use strict';

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const PSYCHOHISTORY = 'ΣΔΨΩλπ∫∂∞≈∇∑√';
    const FONT_SIZE = 16;

    function layer(className) {
        const canvas = document.createElement('canvas');
        canvas.className = className;
        canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
        return canvas;
    }

    const sky = layer('matrix-rain galaxy-sky');
    const rain = layer('matrix-rain');
    const skyCtx = sky.getContext('2d');
    const ctx = rain.getContext('2d');

    let columns = [];
    let timer = null;

    function allowed() {
        return !reducedMotion.matches
            && !root.classList.contains('a11y-motion')
            && !root.classList.contains('a11y-contrast')
            && !document.hidden;
    }

    // Ciel : étoiles de tailles et couleurs variées, plus denses le long d'une bande galactique.
    function drawSky() {
        const w = sky.width;
        const h = sky.height;
        skyCtx.clearRect(0, 0, w, h);
        const count = Math.floor((w * h) / 2500);
        for (let i = 0; i < count; i++) {
            let x = Math.random() * w;
            let y = Math.random() * h;
            if (i % 3 === 0) {
                // Bande galactique en diagonale
                const t = Math.random();
                x = t * w;
                y = h * (0.85 - 0.7 * t) + (Math.random() - 0.5) * h * 0.18;
            }
            const r = Math.random() < 0.94 ? Math.random() * 1.1 : 1.2 + Math.random() * 1.2;
            const tint = Math.random();
            skyCtx.fillStyle = tint > 0.92 ? '#e8c26a' : tint > 0.8 ? '#5fd4ff' : '#dfe9ff';
            skyCtx.globalAlpha = 0.35 + Math.random() * 0.65;
            skyCtx.beginPath();
            skyCtx.arc(x, y, r, 0, Math.PI * 2);
            skyCtx.fill();
        }
        skyCtx.globalAlpha = 1;
        sky.hidden = root.classList.contains('a11y-contrast');
    }

    function resize() {
        [sky, rain].forEach((c) => {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        });
        columns = Array.from({ length: Math.ceil(rain.width / FONT_SIZE) }, () => Math.floor(Math.random() * -50));
        drawSky();
    }

    function draw() {
        // Effacement progressif (et non remplissage) pour laisser voir le ciel derrière.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, rain.width, rain.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = FONT_SIZE + 'px monospace';

        columns.forEach((y, i) => {
            const math = Math.random() < 0.18;
            const set = math ? PSYCHOHISTORY : CHARS;
            const char = set[Math.floor(Math.random() * set.length)];
            ctx.fillStyle = math ? '#e8c26a' : Math.random() > 0.96 ? '#d6ffe3' : '#39ff7a';
            ctx.fillText(char, i * FONT_SIZE, y * FONT_SIZE);
            columns[i] = (y * FONT_SIZE > rain.height && Math.random() > 0.975) ? 0 : y + 1;
        });
    }

    function update() {
        sky.hidden = root.classList.contains('a11y-contrast');
        if (allowed() && timer === null) {
            rain.hidden = false;
            timer = window.setInterval(draw, 60);
        } else if (!allowed() && timer !== null) {
            window.clearInterval(timer);
            timer = null;
        }
        if (!allowed()) {
            ctx.clearRect(0, 0, rain.width, rain.height);
            rain.hidden = true;
        }
    }

    resize();
    update();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', update);
    reducedMotion.addEventListener('change', update);
    new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['class'] });
})();
