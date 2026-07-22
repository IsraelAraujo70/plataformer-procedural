const TERRAIN_PALETTES = {
    Plains: { top: '#47db24', topLight: '#b8f23c', topDark: '#087b35', rock: '#8f3e20', rockLight: '#d36928', rockDark: '#32172b', accent: '#ffb52b' },
    Cave: { top: '#2ad6a6', topLight: '#8dffce', topDark: '#075c65', rock: '#33466e', rockLight: '#526f96', rockDark: '#16172f', accent: '#a66cff' },
    Ice: { top: '#d9ffff', topLight: '#ffffff', topDark: '#46bcd4', rock: '#2879ae', rockLight: '#66d9ed', rockDark: '#15345f', accent: '#e7fbff' },
    Desert: { top: '#ffc83e', topLight: '#fff079', topDark: '#e46721', rock: '#b94c21', rockLight: '#f08127', rockDark: '#54203b', accent: '#ffdb55' },
    Sky: { top: '#b7f48e', topLight: '#efffb5', topDark: '#46a88e', rock: '#6554a4', rockLight: '#a77bd1', rockDark: '#242452', accent: '#7ce8ff' },
    Apocalypse: { top: '#ed5a28', topLight: '#ffb12e', topDark: '#7b172a', rock: '#5c2730', rockLight: '#a33a2d', rockDark: '#1d1122', accent: '#ffcf35' },
    Moon: { top: '#cfd5e8', topLight: '#ffffff', topDark: '#69749b', rock: '#676c86', rockLight: '#a6adc6', rockDark: '#28283f', accent: '#79ddff' },
    'Black Hole': { top: '#df3fff', topLight: '#65edff', topDark: '#4b147c', rock: '#3b205c', rockLight: '#77428d', rockDark: '#110b27', accent: '#ff7651' }
};

const OUTLINE = '#071126';

function paletteFor(biomeName) {
    return TERRAIN_PALETTES[biomeName] || TERRAIN_PALETTES.Plains;
}

function seededNoise(value) {
    const raw = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return raw - Math.floor(raw);
}

function drawTopCap(ctx, x, y, width, palette, seed, compact = false) {
    const depth = compact ? 13 : 16;
    const cap = new Path2D();
    cap.moveTo(x - 6, y + depth * 0.64);
    cap.quadraticCurveTo(x - 8, y + 1, x + 3, y - 2);
    const segments = Math.max(4, Math.ceil(width / 28));
    for (let i = 0; i <= segments; i++) {
        cap.lineTo(
            x + width * (i / segments),
            y - 1 - seededNoise(seed + i * 5.9) * (compact ? 2 : 4)
        );
    }
    cap.quadraticCurveTo(x + width + 8, y + 1, x + width + 6, y + depth * 0.64);
    cap.quadraticCurveTo(x + width * 0.5, y + depth + 2, x - 6, y + depth * 0.64);
    cap.closePath();

    const gradient = ctx.createLinearGradient(0, y - 6, 0, y + depth + 3);
    gradient.addColorStop(0, palette.topLight);
    gradient.addColorStop(0.43, palette.top);
    gradient.addColorStop(1, palette.topDark);
    ctx.fillStyle = gradient;
    ctx.fill(cap);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = compact ? 5 : 6;
    ctx.stroke(cap);

    ctx.strokeStyle = 'rgba(255,255,220,0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 1);
    ctx.quadraticCurveTo(x + width / 2, y - 5, x + width - 7, y + 1);
    ctx.stroke();
}

function drawTufts(ctx, x, y, width, palette, biomeName, seed) {
    if (!['Plains', 'Sky', 'Cave'].includes(biomeName)) return;
    const tuftCount = Math.max(2, Math.floor(width / 21));
    for (let i = 0; i < tuftCount; i++) {
        const tx = x + 8 + (i * 19 + seed * 7) % Math.max(12, width - 16);
        const blade = 4 + seededNoise(seed + i * 11) * 6;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tx, y + 1);
        ctx.lineTo(tx + (i % 2 ? 3 : -3), y - blade);
        ctx.stroke();
        ctx.strokeStyle = palette.topLight;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawRockFacets(ctx, body, x, y, width, height, seed) {
    ctx.save();
    ctx.clip(body);
    const facetWidth = 48;
    const facetHeight = 31;
    for (let row = 0; row < Math.ceil(height / facetHeight); row++) {
        for (let col = -1; col < Math.ceil(width / facetWidth) + 1; col++) {
            const fx = x + col * facetWidth + (row % 2) * facetWidth * 0.48;
            const fy = y + 11 + row * facetHeight;
            const centerX = fx + facetWidth * (0.38 + seededNoise(seed + row * 21 + col) * 0.24);
            const centerY = fy + facetHeight * (0.34 + seededNoise(seed + row * 17 + col * 2) * 0.28);

            ctx.fillStyle = (row + col) % 3 === 0
                ? 'rgba(255, 190, 92, 0.15)'
                : ((row + col) % 3 === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(9,10,40,0.17)');
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + facetWidth, fy + seededNoise(seed + col) * 7);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(7, 17, 38, 0.13)';
            ctx.beginPath();
            ctx.moveTo(fx + facetWidth, fy);
            ctx.lineTo(fx + facetWidth * 0.78, fy + facetHeight);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();
        }
    }

    const lowerShade = ctx.createLinearGradient(0, y + height * 0.42, 0, y + height);
    lowerShade.addColorStop(0, 'rgba(4, 10, 35, 0)');
    lowerShade.addColorStop(1, 'rgba(4, 8, 31, 0.45)');
    ctx.fillStyle = lowerShade;
    ctx.fillRect(x - 8, y, width + 16, height + 8);
    ctx.restore();
}

export function drawCoverGroundPlatform(ctx, x, y, width, height, biomeName, chunkIndex = 0, worldX = x) {
    const palette = paletteFor(biomeName);
    // A geometria pode usar coordenadas de tela, mas a semente visual precisa
    // permanecer ancorada no mundo para não mudar quando a câmera se move.
    const seed = Math.floor((worldX + chunkIndex * 97) / 24);
    const visualDepth = Math.min(height - 3, 42 + width * 0.14);
    const body = new Path2D();
    body.moveTo(x, y + 3);
    body.lineTo(x + width, y + 3);
    body.lineTo(x + width, y + Math.min(visualDepth * 0.42, 38));
    const bottomSegments = Math.max(3, Math.ceil(width / 54));
    for (let i = bottomSegments; i >= 0; i--) {
        const normalized = i / bottomSegments;
        const taper = 1 - Math.abs(normalized - 0.5) * 2;
        body.lineTo(
            x + width * i / bottomSegments,
            y + visualDepth * (0.42 + taper * 0.55) - seededNoise(seed + i * 3.7) * 5
        );
    }
    body.closePath();

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const groundGradient = ctx.createLinearGradient(x, y + 4, x, y + height);
    groundGradient.addColorStop(0, palette.rockLight);
    groundGradient.addColorStop(0.42, palette.rock);
    groundGradient.addColorStop(1, palette.rockDark);
    ctx.fillStyle = groundGradient;
    ctx.fill(body);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 8;
    ctx.stroke(body);

    drawRockFacets(ctx, body, x, y, width, visualDepth, seed);
    drawTopCap(ctx, x, y, width, palette, seed);
    drawTufts(ctx, x, y, width, palette, biomeName, seed);

    const mineralCount = Math.min(5, Math.ceil(width / 70));
    for (let i = 0; i < mineralCount; i++) {
        const sx = x + 14 + seededNoise(seed + i * 31) * Math.max(4, width - 28);
        const sy = y + 22 + seededNoise(seed + i * 47) * Math.max(4, visualDepth * 0.44);
        ctx.fillStyle = i % 2 ? palette.accent : 'rgba(255,255,255,0.72)';
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

export function drawCoverFloatingPlatform(ctx, x, y, width, height, biomeName, chunkIndex = 0, worldX = x) {
    const palette = paletteFor(biomeName);
    const seed = Math.floor((worldX + chunkIndex * 131) / 17);
    const capHeight = Math.max(13, Math.min(18, height * 0.42));
    const depth = Math.max(34, Math.min(62, width * 0.34));
    const pointX = x + width * (0.44 + seededNoise(seed) * 0.12);
    const island = new Path2D();
    island.moveTo(x - 4, y + 7);
    island.quadraticCurveTo(x, y + capHeight, x + width * 0.16, y + capHeight + 5);
    island.lineTo(pointX - width * 0.1, y + depth * 0.78);
    island.lineTo(pointX, y + depth);
    island.lineTo(pointX + width * 0.18, y + depth * 0.72);
    island.lineTo(x + width * 0.86, y + capHeight + 5);
    island.quadraticCurveTo(x + width + 4, y + capHeight, x + width + 4, y + 7);
    island.closePath();

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const shadow = ctx.createRadialGradient(x + width / 2, y + depth + 10, 0, x + width / 2, y + depth + 10, width * 0.55);
    shadow.addColorStop(0, 'rgba(2, 5, 25, 0.28)');
    shadow.addColorStop(1, 'rgba(2, 5, 25, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + depth + 11, width * 0.47, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const rockGradient = ctx.createLinearGradient(x, y, pointX, y + depth);
    rockGradient.addColorStop(0, palette.rockLight);
    rockGradient.addColorStop(0.48, palette.rock);
    rockGradient.addColorStop(1, palette.rockDark);
    ctx.fillStyle = rockGradient;
    ctx.fill(island);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 8;
    ctx.stroke(island);

    ctx.save();
    ctx.clip(island);
    const facetCount = Math.max(3, Math.floor(width / 28));
    for (let i = 0; i < facetCount; i++) {
        const left = x + i * width / facetCount;
        const right = x + (i + 1) * width / facetCount;
        const mid = (left + right) / 2 + (seededNoise(seed + i) - 0.5) * 8;
        ctx.fillStyle = i % 2 ? 'rgba(255,190,80,0.16)' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(left, y + capHeight - 2);
        ctx.lineTo(right, y + capHeight + 2);
        ctx.lineTo(mid, y + depth * (0.7 + seededNoise(seed + i * 9) * 0.23));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(7,17,38,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    const underside = ctx.createLinearGradient(0, y + depth * 0.4, 0, y + depth);
    underside.addColorStop(0, 'rgba(7,17,38,0)');
    underside.addColorStop(1, 'rgba(7,8,30,0.48)');
    ctx.fillStyle = underside;
    ctx.fillRect(x - 8, y, width + 16, depth + 6);
    ctx.restore();

    drawTopCap(ctx, x, y, width, palette, seed, true);
    drawTufts(ctx, x, y, width, palette, biomeName, seed);
    ctx.restore();
}
