// Thème « Fondation » (moderne et technique) : ajoute le décor en arrière-plan.
// Planètes Trantor, Terminus et Synnax avec repères de ciblage et étiquettes,
// liens du réseau chiral entre elles (touche Death Stranding) et vaisseau de Seldon.
// Tout est décoratif (aria-hidden) ; les animations sont en CSS et s'arrêtent
// avec « Réduire les animations ».

(function () {
    'use strict';

    // Dossier des images, retrouvé à partir de l'adresse de ce script
    // (fonctionne aussi quand le site est dans un sous-dossier, comme sur GitHub Pages).
    const imgDir = new URL('../../img/fondation/', document.currentScript.src).href;

    const scene = document.createElement('div');
    scene.className = 'fondation-scene';
    scene.setAttribute('aria-hidden', 'true');

    // Liens du réseau chiral : positions en % de l'écran, au centre approximatif de chaque planète.
    const svgNS = 'http://www.w3.org/2000/svg';
    const strands = document.createElementNS(svgNS, 'svg');
    strands.setAttribute('class', 'strands');
    strands.setAttribute('viewBox', '0 0 100 100');
    strands.setAttribute('preserveAspectRatio', 'none');
    const points = { trantor: [88, 32], synnax: [8, 31], terminus: [6, 82] };
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

    // Planètes : image recadrée (sans son nom dessiné) + étiquette façon interface.
    const planets = [
        { name: 'synnax', label: 'SYNNAX', info: 'OCÉAN' },
        { name: 'terminus', label: 'TERMINUS', info: 'FONDATION' },
        { name: 'trantor', label: 'TRANTOR', info: 'CAPITALE' },
    ];
    planets.forEach(({ name, label, info }) => {
        const planet = document.createElement('div');
        planet.className = 'planet ' + name;
        const crop = document.createElement('div');
        crop.className = 'planet-crop';
        const img = document.createElement('img');
        img.src = imgDir + name + '.svg';
        img.alt = '';
        img.decoding = 'async';
        crop.appendChild(img);
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = label + ' · <b>' + info + '</b>';
        planet.append(crop, tag);
        scene.appendChild(planet);
    });

    const ship = document.createElement('img');
    ship.src = imgDir + 'vaisseau.svg';
    ship.alt = '';
    ship.className = 'vaisseau';
    scene.appendChild(ship);

    document.body.prepend(scene);
})();
