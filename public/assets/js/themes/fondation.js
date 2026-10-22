// Thème « Fondation » : ciel galactique avec étoiles scintillantes, et légère pluie
// d'équations de psychohistoire (touche Matrix).
// Les animations s'arrêtent si l'utilisateur demande moins d'animations ;
// tout est masqué en contraste renforcé.

(function () {
    'use strict';

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SYMBOLS = 'ΣΔΨΩλπ∫∂∞≈∇∑√θφμ0123456789';
    const FONT_SIZE = 18;

    function layer(className) {
        const canvas = document.createElement('canvas');
        canvas.className = 'space-layer ' + className;
        canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
        return canvas;
    }

    const rainCanvas = layer('equations');
    const skyCanvas = layer('stars');
    const sky = skyCanvas.getContext('2d');
    const rain = rainCanvas.getContext('2d');

    let stars = [];
    let columns = [];
    let timer = null;
    let tick = 0;

    function animated() {
        return !reducedMotion.matches && !root.classList.contains('a11y-motion') && !document.hidden;
    }

    function createStars() {
        const w = skyCanvas.width;
        const h = skyCanvas.height;
        const count = Math.floor((w * h) / 2200);
        stars = Array.from({ length: count }, (_, i) => {
            let x = Math.random() * w;
            let y = Math.random() * h;
            if (i % 3 === 0) {
                // Bande galactique en diagonale
                const t = Math.random();
                x = t * w;
                y = h * (0.9 - 0.75 * t) + (Math.random() - 0.5) * h * 0.2;
            }
            const tint = Math.random();
            return {
                x,
                y,
                r: Math.random() < 0.93 ? Math.random() * 1.1 + 0.2 : 1.3 + Math.random() * 1.3,
                color: tint > 0.9 ? '#e8c26a' : tint > 0.78 ? '#5fd4ff' : '#e6ecff',
                base: 0.35 + Math.random() * 0.6,
                phase: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.05,
            };
        });
    }

    function drawStars() {
        sky.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
        stars.forEach((s) => {
            const twinkle = animated() ? 0.25 * Math.sin(s.phase + tick * s.speed) : 0;
            sky.globalAlpha = Math.max(0.1, Math.min(1, s.base + twinkle));
            sky.fillStyle = s.color;
            sky.beginPath();
            sky.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            sky.fill();
        });
        sky.globalAlpha = 1;
    }

    function drawRain() {
        rain.globalCompositeOperation = 'destination-out';
        rain.fillStyle = 'rgba(0, 0, 0, 0.1)';
        rain.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
        rain.globalCompositeOperation = 'source-over';
        rain.font = FONT_SIZE + 'px serif';
        columns.forEach((y, i) => {
            if (y < 0) {
                columns[i] = y + 1;
                return;
            }
            const char = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const r = Math.random();
            rain.fillStyle = r > 0.97 ? '#39ff7a' : r > 0.5 ? '#e8c26a' : '#5fd4ff';
            rain.fillText(char, i * FONT_SIZE * 2, y * FONT_SIZE);
            columns[i] = (y * FONT_SIZE > rainCanvas.height && Math.random() > 0.97) ? Math.floor(Math.random() * -40) : y + 1;
        });
    }

    function frame() {
        tick++;
        drawStars();
        drawRain();
    }

    function resize() {
        [skyCanvas, rainCanvas].forEach((c) => {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        });
        // Une colonne sur deux seulement : pluie volontairement clairsemée.
        columns = Array.from({ length: Math.ceil(rainCanvas.width / (FONT_SIZE * 2)) }, () => Math.floor(Math.random() * -80));
        createStars();
        drawStars();
    }

    function update() {
        if (animated() && timer === null) {
            rainCanvas.hidden = false;
            timer = window.setInterval(frame, 80);
        } else if (!animated() && timer !== null) {
            window.clearInterval(timer);
            timer = null;
        }
        if (!animated()) {
            rain.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
            rainCanvas.hidden = true;
            drawStars(); // ciel fixe, sans scintillement
        }
    }

    resize();
    update();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', update);
    reducedMotion.addEventListener('change', update);
    new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['class'] });
})();
