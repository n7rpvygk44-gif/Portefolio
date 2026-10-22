// Thème « Fondation » (clair) : ajoute le décor en arrière-plan.
// Planètes Trantor, Terminus et Synnax, liens du réseau chiral entre elles (touche Death Stranding)
// et vaisseau de Seldon qui traverse le ciel. Tout est décoratif (aria-hidden) ;
// les animations sont gérées en CSS et s'arrêtent avec « Réduire les animations ».

(function () {
    'use strict';

    // Dossier des images, retrouvé à partir de l'adresse de ce script
    // (fonctionne aussi quand le site est dans un sous-dossier, comme sur GitHub Pages).
    const script = document.currentScript;
    const imgDir = new URL('../../img/fondation/', script.src).href;

    const scene = document.createElement('div');
    scene.className = 'fondation-scene';
    scene.setAttribute('aria-hidden', 'true');

    // Liens du réseau chiral : positions en % de l'écran, au centre approximatif de chaque planète.
    const svgNS = 'http://www.w3.org/2000/svg';
    const strands = document.createElementNS(svgNS, 'svg');
    strands.setAttribute('class', 'strands');
    strands.setAttribute('viewBox', '0 0 100 100');
    strands.setAttribute('preserveAspectRatio', 'none');
    const points = { trantor: [86, 30], synnax: [8, 31], terminus: [6, 86] };
    [['trantor', 'synnax'], ['synnax', 'terminus'], ['terminus', 'trantor']].forEach(([a, b]) => {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', points[a][0]);
        line.setAttribute('y1', points[a][1]);
        line.setAttribute('x2', points[b][0]);
        line.setAttribute('y2', points[b][1]);
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        strands.appendChild(line);
    });
    scene.appendChild(strands);

    ['synnax', 'terminus', 'trantor', 'vaisseau'].forEach((name) => {
        const img = document.createElement('img');
        img.src = imgDir + name + '.svg';
        img.alt = '';
        img.className = name;
        img.decoding = 'async';
        scene.appendChild(img);
    });

    document.body.prepend(scene);
})();
