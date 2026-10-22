// Ambiance sonore du site, dans l'esprit des tableaux de bord épurés (verre, aluminium, lumière) :
// - « rituel » de démarrage quand on active le son : déclic d'une clé, puis accord cristallin ;
// - nappe d'ambiance très discrète tant que le son est activé ;
// - sons d'interface : déclic net au clic, effleurement au survol, tintement quand un élément se déploie.
// Tous les sons sont synthétisés en direct (Web Audio API) : aucun fichier audio, créations originales.
// Le son est coupé par défaut. Le choix est mémorisé dans le navigateur. Les navigateurs interdisent
// de jouer un son avant une action de l'utilisateur : le son démarre donc au premier clic ou touche.

(function () {
    'use strict';

    const STORAGE_KEY = 'portfolio-son';
    const button = document.querySelector('.sound-toggle');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!button || !AudioCtx) {
        if (button) {
            button.hidden = true;
        }
        return;
    }

    let enabled = false;
    try {
        enabled = localStorage.getItem(STORAGE_KEY) === 'on';
    } catch (e) {
        enabled = false;
    }

    let ctx = null;
    let master = null;
    let ambient = null;
    let noiseBuffer = null;

    function setup() {
        if (ctx) {
            return;
        }
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = 0.7;
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp);
        comp.connect(ctx.destination);
        // Bruit blanc réutilisé pour les déclics et les souffles.
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    function envelope(gain, t, attack, peak, decay) {
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(peak, t + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }

    // Note de verre : fondamentale + partiels inharmoniques, décroissance douce.
    function glass(freq, when, volume, decay) {
        const t = ctx.currentTime + (when || 0);
        [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([ratio, level]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq * ratio;
            envelope(gain, t, 0.006, volume * level, (decay || 1.6) / ratio);
            osc.connect(gain).connect(master);
            osc.start(t);
            osc.stop(t + 3);
        });
    }

    // Déclic d'un inverseur en aluminium : impulsion de bruit filtrée + petit choc grave.
    function click(when, volume) {
        const t = ctx.currentTime + (when || 0);
        const v = volume || 0.18;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = 3800;
        band.Q.value = 1.8;
        const nGain = ctx.createGain();
        envelope(nGain, t, 0.001, v, 0.018);
        noise.connect(band).connect(nGain).connect(master);
        noise.start(t);
        noise.stop(t + 0.05);
        const thump = ctx.createOscillator();
        const tGain = ctx.createGain();
        thump.frequency.setValueAtTime(190, t);
        thump.frequency.exponentialRampToValueAtTime(70, t + 0.04);
        envelope(tGain, t, 0.002, v * 0.6, 0.045);
        thump.connect(tGain).connect(master);
        thump.start(t);
        thump.stop(t + 0.08);
    }

    // Effleurement au survol : très court et très doux.
    function tick() {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 2600;
        envelope(gain, t, 0.002, 0.018, 0.02);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    // Rituel de démarrage : la clé s'enclenche, le tableau de bord s'illumine.
    function startup() {
        click(0, 0.25);
        // Souffle lumineux qui monte.
        const t = ctx.currentTime + 0.08;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const low = ctx.createBiquadFilter();
        low.type = 'lowpass';
        low.frequency.setValueAtTime(180, t);
        low.frequency.exponentialRampToValueAtTime(2600, t + 1.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
        noise.connect(low).connect(g).connect(master);
        noise.start(t);
        noise.stop(t + 2);
        // Accord cristallin (mi, si, mi, sol dièse).
        [659.3, 987.8, 1318.5, 1661.2].forEach((f, i) => glass(f, 0.35 + i * 0.11, 0.07 - i * 0.01, 2.4));
    }

    // Nappe d'ambiance : bourdon grave filtré qui respire lentement, avec un léger scintillement.
    function startAmbient() {
        if (ambient) {
            return;
        }
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, t);
        out.gain.exponentialRampToValueAtTime(0.06, t + 4);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 420;
        filter.Q.value = 0.7;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.07;
        lfoGain.gain.value = 180;
        lfo.connect(lfoGain).connect(filter.frequency);
        const voices = [[82.41, 'sine', 0.5], [82.9, 'sine', 0.4], [123.47, 'triangle', 0.18], [164.81, 'sine', 0.12]].map(([f, type, level]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = f;
            gain.gain.value = level;
            osc.connect(gain).connect(filter);
            osc.start(t);
            return osc;
        });
        // Scintillement aigu, à peine audible.
        const shimmer = ctx.createOscillator();
        const sGain = ctx.createGain();
        const trem = ctx.createOscillator();
        const tremGain = ctx.createGain();
        shimmer.frequency.value = 1975.5;
        sGain.gain.value = 0.006;
        trem.frequency.value = 0.18;
        tremGain.gain.value = 0.005;
        trem.connect(tremGain).connect(sGain.gain);
        shimmer.connect(sGain).connect(out);
        filter.connect(out);
        out.connect(master);
        [lfo, shimmer, trem].forEach((o) => o.start(t));
        ambient = { out, nodes: voices.concat([lfo, shimmer, trem]) };
    }

    function stopAmbient() {
        if (!ambient) {
            return;
        }
        const { out, nodes } = ambient;
        ambient = null;
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        nodes.forEach((n) => n.stop(t + 1));
    }

    function render() {
        button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        button.querySelector('.sound-label').textContent = enabled ? 'Son activé' : 'Son coupé';
        button.title = enabled ? 'Couper le son du site' : 'Activer le son du site';
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
        } catch (e) {
            // Stockage indisponible : le choix vaut pour la page en cours.
        }
    }

    // Démarre le son (appelé uniquement pendant une action de l'utilisateur).
    function wake(ritual) {
        setup();
        const go = () => {
            if (ritual) {
                startup();
            } else {
                glass(1318.5, 0, 0.04, 1.8);
            }
            startAmbient();
        };
        if (ctx.state === 'suspended') {
            ctx.resume().then(go);
        } else {
            go();
        }
    }

    button.addEventListener('click', () => {
        enabled = !enabled;
        save();
        render();
        if (enabled) {
            wake(true);
        } else if (ctx) {
            stopAmbient();
        }
    });

    // Son mémorisé comme activé : il reprend à la première action sur la page.
    if (enabled) {
        const resume = (event) => {
            if (event.target.closest && event.target.closest('.sound-toggle')) {
                return;
            }
            document.removeEventListener('pointerdown', resume, true);
            document.removeEventListener('keydown', resume, true);
            if (enabled) {
                wake(false);
            }
        };
        document.addEventListener('pointerdown', resume, true);
        document.addEventListener('keydown', resume, true);
    }

    const live = () => enabled && ctx && ctx.state === 'running';

    // Sons d'interface.
    document.addEventListener('click', (event) => {
        if (live() && event.target.closest('a, button:not(.sound-toggle), summary')) {
            click();
        }
    });
    let lastTick = 0;
    document.addEventListener('pointerover', (event) => {
        if (event.pointerType !== 'mouse' || !live()) {
            return;
        }
        const target = event.target.closest('a, button, summary');
        if (!target || target.contains(event.relatedTarget)) {
            return;
        }
        const now = performance.now();
        if (now - lastTick > 70) {
            lastTick = now;
            tick();
        }
    });
    // Tintement quand le thème déploie un élément de l'interface (voir themes/fondation.js).
    let lastReveal = 0;
    let revealNote = 0;
    const notes = [1318.5, 1479.98, 1661.2, 1975.5];
    document.addEventListener('portfolio:reveal', () => {
        const now = performance.now();
        if (!live() || now - lastReveal < 140) {
            return;
        }
        lastReveal = now;
        glass(notes[revealNote++ % notes.length], 0, 0.02, 1.2);
    });

    render();
})();
