// Ambiance sonore du site, dans l'esprit des tableaux de bord épurés (verre, aluminium, lumière) :
// - « rituel » de démarrage : déclic métallique d'une clé, puis le tableau de bord s'illumine ;
// - bande-son de l'introduction du Radiant, synchronisée avec l'animation (thème Fondation) ;
// - nappe d'ambiance tant que le son est activé ;
// - sons d'interface : déclic d'inverseur en aluminium au clic, effleurement au survol,
//   tintement de verre quand un élément de l'interface se déploie.
// Tous les sons sont synthétisés en direct (Web Audio API) : aucun fichier audio, créations originales.
// Le son est coupé par défaut et le choix est mémorisé. Les navigateurs interdisent de jouer un son
// avant une action de l'utilisateur : il démarre au premier clic ou à la première touche.
// Le thème peut piloter le son grâce à window.portfolioSound (voir themes/fondation.js).

(function () {
    'use strict';

    const STORAGE_KEY = 'portfolio-son';
    const button = document.querySelector('.sound-toggle');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
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
    let reverb = null;
    let ambient = null;
    let noiseBuffer = null;

    // ----- Mise en place : volume général, compresseur et réverbération (salle de verre) -----
    function setup() {
        if (ctx) {
            return;
        }
        ctx = new AudioCtx();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 3;
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(comp);
        comp.connect(ctx.destination);

        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Réponse impulsionnelle générée : bruit qui décroît sur 3 secondes, en stéréo.
        const length = ctx.sampleRate * 3;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const ch = impulse.getChannelData(c);
            for (let i = 0; i < length; i++) {
                ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
            }
        }
        reverb = ctx.createConvolver();
        reverb.buffer = impulse;
        const wet = ctx.createGain();
        wet.gain.value = 0.45;
        reverb.connect(wet).connect(master);
    }

    // Envoie un son vers la sortie, avec une part plus ou moins grande de réverbération.
    function out(node, wet) {
        node.connect(master);
        if (wet) {
            const send = ctx.createGain();
            send.gain.value = wet;
            node.connect(send).connect(reverb);
        }
    }

    function envelope(param, t, attack, peak, decay) {
        param.setValueAtTime(0.0001, t);
        param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
        param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }

    // ----- Instruments -----

    // Note de verre : fondamentale + partiels inharmoniques, décroissance longue et réverbérée.
    function glass(freq, when, volume, decay) {
        const t = ctx.currentTime + (when || 0);
        const bus = ctx.createGain();
        out(bus, 0.9);
        [[1, 1], [2.76, 0.4], [5.4, 0.16], [8.93, 0.06]].forEach(([ratio, level]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * ratio;
            envelope(gain.gain, t, 0.004, volume * level, (decay || 2) / Math.sqrt(ratio));
            osc.connect(gain).connect(bus);
            osc.start(t);
            osc.stop(t + 5);
        });
    }

    // Cloche lumineuse (synthèse FM) : le timbre « verre éclairé ».
    function bell(freq, when, volume, decay) {
        const t = ctx.currentTime + (when || 0);
        const carrier = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const gain = ctx.createGain();
        carrier.frequency.value = freq;
        mod.frequency.value = freq * 3.5;
        envelope(modGain.gain, t, 0.003, freq * 1.6, (decay || 2.5) * 0.4);
        mod.connect(modGain).connect(carrier.frequency);
        envelope(gain.gain, t, 0.005, volume, decay || 2.5);
        carrier.connect(gain);
        out(gain, 1);
        carrier.start(t);
        mod.start(t);
        carrier.stop(t + 6);
        mod.stop(t + 6);
    }

    // Souffle filtré qui balaie le spectre (déploiement, ouverture d'un anneau).
    function whoosh(when, duration, from, to, volume) {
        const t = ctx.currentTime + (when || 0);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.Q.value = 1.4;
        band.frequency.setValueAtTime(from, t);
        band.frequency.exponentialRampToValueAtTime(to, t + duration);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + duration * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        noise.connect(band).connect(gain);
        out(gain, 0.6);
        noise.start(t);
        noise.stop(t + duration + 0.1);
    }

    // Grave qui enfle : le Radiant prend vie.
    function swell(when, duration, volume) {
        const t = ctx.currentTime + (when || 0);
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(41.2, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + duration);
        sub.frequency.setValueAtTime(82.4, t);
        sub.frequency.exponentialRampToValueAtTime(110, t + duration);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + duration * 0.85);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 1.2);
        osc.connect(gain);
        sub.connect(gain);
        out(gain, 0.3);
        osc.start(t);
        sub.start(t);
        osc.stop(t + duration + 1.3);
        sub.stop(t + duration + 1.3);
    }

    // Déclic d'un inverseur en aluminium usiné : appui, petite résonance métallique, relâchement.
    function click(when, volume) {
        const t = ctx.currentTime + (when || 0);
        const v = volume || 0.4;
        [[0, 1], [0.045, 0.55]].forEach(([offset, level]) => {
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const band = ctx.createBiquadFilter();
            band.type = 'bandpass';
            band.frequency.value = 3200;
            band.Q.value = 2.2;
            const gain = ctx.createGain();
            envelope(gain.gain, t + offset, 0.0008, v * level, 0.022);
            noise.connect(band).connect(gain);
            out(gain, 0.15);
            noise.start(t + offset);
            noise.stop(t + offset + 0.06);
        });
        // Résonance du métal.
        const ring = ctx.createOscillator();
        const rGain = ctx.createGain();
        ring.frequency.value = 4186;
        envelope(rGain.gain, t, 0.001, v * 0.12, 0.09);
        ring.connect(rGain);
        out(rGain, 0.3);
        ring.start(t);
        ring.stop(t + 0.15);
        // Petit choc grave.
        const thump = ctx.createOscillator();
        const tGain = ctx.createGain();
        thump.frequency.setValueAtTime(160, t);
        thump.frequency.exponentialRampToValueAtTime(60, t + 0.05);
        envelope(tGain.gain, t, 0.002, v * 0.7, 0.06);
        thump.connect(tGain);
        out(tGain, 0);
        thump.start(t);
        thump.stop(t + 0.1);
    }

    // Effleurement au survol.
    function tick() {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 2793;
        envelope(gain.gain, t, 0.002, 0.06, 0.05);
        osc.connect(gain);
        out(gain, 0.4);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // ----- Nappe d'ambiance : accord grave qui respire, voix aérienne, scintillement -----
    function startAmbient(fadeIn) {
        if (ambient) {
            return;
        }
        const t = ctx.currentTime;
        const bus = ctx.createGain();
        bus.gain.setValueAtTime(0.0001, t);
        bus.gain.exponentialRampToValueAtTime(0.16, t + (fadeIn || 4));
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        filter.Q.value = 0.8;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.06;
        lfoGain.gain.value = 350;
        lfo.connect(lfoGain).connect(filter.frequency);
        const nodes = [lfo];
        // Mi grave, si, mi, sol dièse : accord ouvert et lumineux.
        [[82.41, 'sawtooth', 0.18], [82.9, 'sawtooth', 0.15], [123.47, 'triangle', 0.3], [164.81, 'sine', 0.3], [207.65, 'sine', 0.14]].forEach(([f, type, level]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = f;
            gain.gain.value = level;
            osc.connect(gain).connect(filter);
            nodes.push(osc);
        });
        filter.connect(bus);
        // Scintillement aigu qui va et vient.
        const shimmer = ctx.createOscillator();
        const sGain = ctx.createGain();
        const trem = ctx.createOscillator();
        const tremGain = ctx.createGain();
        shimmer.frequency.value = 1318.5;
        sGain.gain.value = 0.02;
        trem.frequency.value = 0.15;
        tremGain.gain.value = 0.018;
        trem.connect(tremGain).connect(sGain.gain);
        shimmer.connect(sGain).connect(bus);
        nodes.push(shimmer, trem);
        out(bus, 0.5);
        nodes.forEach((o) => o.start(t));
        ambient = { bus, nodes };
    }

    function stopAmbient() {
        if (!ambient) {
            return;
        }
        const { bus, nodes } = ambient;
        ambient = null;
        const t = ctx.currentTime;
        bus.gain.cancelScheduledValues(t);
        bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t);
        bus.gain.exponentialRampToValueAtTime(0.0001, t + 1);
        nodes.forEach((n) => n.stop(t + 1.2));
    }

    // ----- Scènes -----

    // Rituel de démarrage : la clé s'enclenche, le tableau de bord s'illumine.
    function startup() {
        click(0, 0.55);
        swell(0.05, 1.2, 0.22);
        whoosh(0.1, 1.3, 180, 3000, 0.08);
        [659.3, 987.8, 1318.5, 1661.2].forEach((f, i) => glass(f, 0.55 + i * 0.12, 0.13 - i * 0.02, 2.6));
        bell(2637, 1.1, 0.035, 3);
    }

    // Bande-son de l'introduction du Radiant (durée totale en secondes, alignée sur le CSS du thème).
    function intro(timeline) {
        const tl = timeline || {};
        click(0, 0.55);                                    // la clé s'insère
        swell(0.1, (tl.wake || 1.4), 0.32);                // le Radiant s'éveille
        glass(329.6, tl.wake || 1.4, 0.16, 4);            // il s'illumine
        bell(1318.5, (tl.wake || 1.4) + 0.05, 0.05, 4);
        const notes = [659.3, 987.8, 1318.5, 1661.2];
        (tl.rings || [1.6, 2.4, 3.2, 4]).forEach((at, i) => {   // chaque anneau d'équations s'ouvre
            whoosh(at - 0.3, 1.6, 250 + i * 200, 4200, 0.07);
            glass(notes[i], at + 0.2, 0.12, 3.2);
        });
        setTimeout(() => startAmbient(3), ((tl.rings || [1.6])[0]) * 1000);
        const end = tl.end || 8;                          // l'interface se déploie
        whoosh(end - 1.2, 1.6, 400, 6000, 0.09);
        [1318.5, 1661.2, 1975.5, 2637].forEach((f, i) => bell(f, end - 0.6 + i * 0.09, 0.04, 2.5));
    }

    // ----- Activation -----

    function render() {
        if (!button) {
            return;
        }
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

    // Démarre le son (uniquement pendant une action de l'utilisateur), puis joue une scène.
    function wake(scene) {
        setup();
        if (ctx.state === 'suspended') {
            ctx.resume().then(scene);
        } else {
            scene();
        }
    }

    function setEnabled(value) {
        enabled = value;
        save();
        render();
        if (!enabled && ctx) {
            stopAmbient();
        }
    }

    if (button) {
        button.addEventListener('click', () => {
            setEnabled(!enabled);
            if (enabled) {
                wake(() => { startup(); startAmbient(4); });
            }
        });
    }

    // Son mémorisé comme activé : il reprend à la première action sur la page.
    let resumed = false;
    const resume = (event) => {
        if (resumed || !enabled || (event.target.closest && event.target.closest('.sound-toggle, .radiant-intro'))) {
            return;
        }
        resumed = true;
        wake(() => { glass(1318.5, 0, 0.08, 2.5); startAmbient(3); });
    };
    document.addEventListener('pointerdown', resume, true);
    document.addEventListener('keydown', resume, true);

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
    // Tintement quand le thème déploie un élément de l'interface.
    let lastReveal = 0;
    let revealNote = 0;
    const revealNotes = [1318.5, 1479.98, 1661.2, 1975.5, 2217.5];
    document.addEventListener('portfolio:reveal', () => {
        const now = performance.now();
        if (!live() || now - lastReveal < 120) {
            return;
        }
        lastReveal = now;
        glass(revealNotes[revealNote++ % revealNotes.length], 0, 0.06, 1.6);
    });

    // Interface pour le thème : l'introduction du Radiant démarre le son avec sa propre bande-son.
    window.portfolioSound = {
        isEnabled: () => enabled,
        playIntro(timeline) {
            setEnabled(true);
            resumed = true;
            wake(() => intro(timeline));
        },
        disable() {
            setEnabled(false);
        },
    };

    render();
})();
