// Thème « Codec » : pluie de caractères en arrière-plan, façon Matrix.
// Désactivée si l'utilisateur demande moins d'animations (système ou panneau d'accessibilité)
// ou en contraste renforcé.

(function () {
    'use strict';

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789SISR';
    const FONT_SIZE = 16;

    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-rain';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let columns = [];
    let timer = null;

    function allowed() {
        return !reducedMotion.matches
            && !root.classList.contains('a11y-motion')
            && !root.classList.contains('a11y-contrast')
            && !document.hidden;
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const count = Math.ceil(canvas.width / FONT_SIZE);
        columns = Array.from({ length: count }, () => Math.floor(Math.random() * -50));
    }

    function draw() {
        // Voile semi-transparent : les caractères précédents s'estompent peu à peu.
        ctx.fillStyle = 'rgba(1, 8, 5, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = FONT_SIZE + 'px monospace';

        columns.forEach((y, i) => {
            const char = CHARS[Math.floor(Math.random() * CHARS.length)];
            // Tête de colonne plus claire, le reste en vert.
            ctx.fillStyle = Math.random() > 0.96 ? '#d6ffe3' : '#39ff7a';
            ctx.fillText(char, i * FONT_SIZE, y * FONT_SIZE);
            columns[i] = (y * FONT_SIZE > canvas.height && Math.random() > 0.975) ? 0 : y + 1;
        });
    }

    function update() {
        if (allowed() && timer === null) {
            canvas.hidden = false;
            timer = window.setInterval(draw, 55);
        } else if (!allowed() && timer !== null) {
            window.clearInterval(timer);
            timer = null;
        }
        if (!allowed()) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.hidden = true;
        }
    }

    resize();
    update();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', update);
    reducedMotion.addEventListener('change', update);
    // Réagit immédiatement aux boutons du panneau d'accessibilité.
    new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['class'] });
})();
