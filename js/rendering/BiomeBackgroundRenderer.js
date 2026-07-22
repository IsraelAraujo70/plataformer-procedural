const OUTLINE = '#071126';

function noise(value) {
    const raw = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return raw - Math.floor(raw);
}

export function getStableMoonSurfacePoints(width, cameraX, horizon) {
    const spacing = 80;
    const parallaxCamera = cameraX * 0.18;
    const firstWorldIndex = Math.floor(parallaxCamera / spacing) - 2;
    const offset = parallaxCamera % spacing;
    const pointCount = Math.ceil(width / spacing) + 5;

    return Array.from({ length: pointCount }, (_, index) => {
        const worldIndex = firstWorldIndex + index;
        return {
            worldIndex,
            x: (index - 2) * spacing - offset,
            y: horizon - noise(worldIndex * 3.17) * 46
        };
    });
}

function fillGradient(ctx, game, stops) {
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    stops.forEach(([position, color]) => gradient.addColorStop(position, color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);
}

function drawGlow(ctx, x, y, radius, inner, outer = 'rgba(255,255,255,0)') {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, inner);
    glow.addColorStop(1, outer);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawStars(ctx, game, count, colors, opacity = 0.7, parallax = 0.025) {
    const span = game.width + 100;
    const offset = game.camera.x * parallax;
    const time = Date.now() / 1000;
    for (let i = 0; i < count; i++) {
        const x = ((i * 173.7 - offset) % span + span) % span - 50;
        const y = 18 + ((i * 97) % Math.max(80, game.height * 0.68));
        const pulse = opacity * (0.72 + Math.sin(time * 1.35 + i * 1.9) * 0.18);
        const radius = i % 17 === 0 ? 1.9 : (i % 6 === 0 ? 1.2 : 0.65);
        ctx.fillStyle = colors[i % colors.length].replace('ALPHA', pulse.toFixed(3));
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (i % 17 === 0) {
            ctx.strokeStyle = `rgba(255,255,255,${pulse * 0.52})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 4, y);
            ctx.lineTo(x + 4, y);
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x, y + 4);
            ctx.stroke();
        }
    }
}

function drawCloud(ctx, x, y, scale, fill, shadow = 'rgba(42,92,150,0.16)') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(3, 13, 54, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(-34, 4, 22, 0, Math.PI * 2);
    ctx.arc(-7, -8, 31, 0, Math.PI * 2);
    ctx.arc(25, 1, 24, 0, Math.PI * 2);
    ctx.arc(43, 9, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.beginPath();
    ctx.ellipse(-13, -16, 20, 9, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMountainBand(ctx, game, options) {
    const {
        baseline, spacing, minHeight, heightVariation, parallax,
        fill, light, shadow, outline = 'rgba(7,17,38,0.52)', lineWidth = 4,
        snow = null
    } = options;
    const cameraPosition = game.camera.x * parallax;
    const firstWorldIndex = Math.floor(cameraPosition / spacing) - 2;
    const localOffset = cameraPosition % spacing;
    const count = Math.ceil(game.width / spacing) + 5;

    for (let i = 0; i < count; i++) {
        const worldIndex = firstWorldIndex + i;
        const x = (i - 2) * spacing - localOffset + spacing / 2;
        const peakHeight = minHeight + noise(worldIndex * 4.7) * heightVariation;
        const halfWidth = spacing * (0.58 + noise(worldIndex * 9.3) * 0.16);

        ctx.fillStyle = fill;
        ctx.strokeStyle = outline;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x - halfWidth, baseline + 18);
        ctx.lineTo(x, baseline - peakHeight);
        ctx.lineTo(x + halfWidth, baseline + 18);
        ctx.closePath();
        ctx.fill();
        if (lineWidth > 0) ctx.stroke();

        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.moveTo(x, baseline - peakHeight);
        ctx.lineTo(x + halfWidth, baseline + 18);
        ctx.lineTo(x + halfWidth * 0.08, baseline + 18);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.moveTo(x, baseline - peakHeight);
        ctx.lineTo(x - halfWidth * 0.16, baseline - peakHeight * 0.26);
        ctx.lineTo(x - halfWidth * 0.4, baseline + 12);
        ctx.lineTo(x - halfWidth * 0.07, baseline + 12);
        ctx.closePath();
        ctx.fill();

        if (snow) {
            ctx.fillStyle = snow;
            ctx.beginPath();
            ctx.moveTo(x, baseline - peakHeight + 2);
            ctx.lineTo(x - halfWidth * 0.22, baseline - peakHeight * 0.58);
            ctx.lineTo(x - halfWidth * 0.04, baseline - peakHeight * 0.68);
            ctx.lineTo(x + halfWidth * 0.13, baseline - peakHeight * 0.52);
            ctx.lineTo(x + halfWidth * 0.24, baseline - peakHeight * 0.58);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawMist(ctx, game, color, top = 0.66, strength = 0.42) {
    const mist = ctx.createLinearGradient(0, game.height * top, 0, game.height);
    mist.addColorStop(0, color.replace('ALPHA', '0'));
    mist.addColorStop(1, color.replace('ALPHA', strength.toString()));
    ctx.fillStyle = mist;
    ctx.fillRect(0, game.height * top, game.width, game.height * (1 - top));
}

function drawPlains(ctx, game) {
    fillGradient(ctx, game, [
        [0, '#56c8ff'],
        [0.48, '#91e8ff'],
        [0.78, '#b9f5dd'],
        [1, '#7fe3a3']
    ]);
    drawGlow(ctx, game.width * 0.78, game.height * 0.2, game.width * 0.28, 'rgba(255,247,173,0.72)');
    drawStars(ctx, game, 28, ['rgba(255,255,255,ALPHA)', 'rgba(255,247,181,ALPHA)'], 0.28, 0.015);

    const cloudOffset = (game.camera.x * 0.035) % 360;
    for (let i = -1; i < Math.ceil(game.width / 320) + 2; i++) {
        drawCloud(
            ctx,
            i * 340 - cloudOffset + 70,
            74 + (i % 3) * 54,
            0.7 + (i % 2) * 0.2,
            'rgba(245,255,255,0.72)'
        );
    }

    drawMountainBand(ctx, game, {
        baseline: game.height * 0.9, spacing: 250, minHeight: 120, heightVariation: 90, parallax: 0.09,
        fill: '#4baec9', light: '#8ee8e5', shadow: '#267fa6', snow: 'rgba(224,255,251,0.82)',
        outline: 'rgba(22,87,122,0.46)', lineWidth: 3
    });
    drawMountainBand(ctx, game, {
        baseline: game.height * 0.97, spacing: 310, minHeight: 84, heightVariation: 56, parallax: 0.17,
        fill: '#239b72', light: '#58d68e', shadow: '#176d69',
        outline: 'rgba(7,72,83,0.42)', lineWidth: 3
    });
    drawMist(ctx, game, 'rgba(190,255,230,ALPHA)', 0.62, 0.25);
}

function drawCave(ctx, game) {
    fillGradient(ctx, game, [[0, '#182847'], [0.46, '#2d315d'], [1, '#123e50']]);
    drawGlow(ctx, game.width * 0.26, game.height * 0.5, game.width * 0.34, 'rgba(59,209,230,0.2)');
    drawGlow(ctx, game.width * 0.8, game.height * 0.42, game.width * 0.28, 'rgba(157,84,255,0.18)');

    const spacing = 145;
    const offset = (game.camera.x * 0.12) % spacing;
    for (let i = -1; i < Math.ceil(game.width / spacing) + 2; i++) {
        const x = i * spacing - offset + spacing / 2;
        const length = 58 + noise(i + Math.floor(game.camera.x * 0.12 / spacing)) * 94;
        ctx.fillStyle = '#222846';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 34, -4);
        ctx.lineTo(x, length);
        ctx.lineTo(x + 30, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(95,122,166,0.3)';
        ctx.beginPath();
        ctx.moveTo(x - 20, 0);
        ctx.lineTo(x - 4, length * 0.72);
        ctx.lineTo(x, length);
        ctx.closePath();
        ctx.fill();
    }

    drawMountainBand(ctx, game, {
        baseline: game.height + 14, spacing: 190, minHeight: 100, heightVariation: 90, parallax: 0.18,
        fill: '#26334e', light: '#3d6172', shadow: '#15172d', outline: OUTLINE, lineWidth: 5
    });

    const crystalOffset = (game.camera.x * 0.24) % 280;
    for (let i = -1; i < Math.ceil(game.width / 280) + 2; i++) {
        const x = i * 280 - crystalOffset + 120;
        const y = game.height * (0.58 + (i % 2) * 0.14);
        const color = i % 2 ? '#a86cff' : '#38e2ef';
        drawGlow(ctx, x, y, 42, i % 2 ? 'rgba(168,108,255,0.28)' : 'rgba(56,226,239,0.25)');
        ctx.fillStyle = color;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 34);
        ctx.lineTo(x + 12, y);
        ctx.lineTo(x, y + 18);
        ctx.lineTo(x - 10, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    drawMist(ctx, game, 'rgba(68,222,210,ALPHA)', 0.66, 0.13);
}

function drawIce(ctx, game) {
    fillGradient(ctx, game, [[0, '#718fe1'], [0.46, '#a7d9f4'], [0.78, '#d9f8ff'], [1, '#a8e7ef']]);
    drawStars(ctx, game, 52, ['rgba(255,255,255,ALPHA)', 'rgba(188,255,248,ALPHA)'], 0.62, 0.02);
    drawGlow(ctx, game.width * 0.16, game.height * 0.2, game.width * 0.25, 'rgba(166,248,255,0.38)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const auroraColors = ['rgba(92,255,204,0.2)', 'rgba(115,174,255,0.19)', 'rgba(210,112,255,0.16)'];
    auroraColors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 32 - index * 6;
        ctx.beginPath();
        ctx.moveTo(-80, game.height * (0.25 + index * 0.06));
        ctx.bezierCurveTo(
            game.width * 0.24, game.height * (0.06 + index * 0.07),
            game.width * 0.6, game.height * (0.48 - index * 0.04),
            game.width + 80, game.height * (0.15 + index * 0.06)
        );
        ctx.stroke();
    });
    ctx.restore();

    drawMountainBand(ctx, game, {
        baseline: game.height * 0.95, spacing: 235, minHeight: 160, heightVariation: 120, parallax: 0.08,
        fill: '#3b83bd', light: '#69d7e6', shadow: '#28528d', snow: '#dffcff', outline: '#16355f', lineWidth: 5
    });
    drawMountainBand(ctx, game, {
        baseline: game.height + 8, spacing: 300, minHeight: 88, heightVariation: 64, parallax: 0.2,
        fill: '#75c9dc', light: '#baf5f4', shadow: '#4b91b7', snow: '#efffff', outline: 'rgba(22,53,95,0.65)', lineWidth: 4
    });

    for (let i = 0; i < 44; i++) {
        const x = ((i * 151 - game.camera.x * 0.1) % (game.width + 80) + game.width + 80) % (game.width + 80) - 40;
        const y = (i * 83 + Date.now() * (0.008 + (i % 4) * 0.002)) % game.height;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 3) * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    drawMist(ctx, game, 'rgba(226,255,255,ALPHA)', 0.6, 0.34);
}

function drawDesert(ctx, game) {
    fillGradient(ctx, game, [[0, '#43a9de'], [0.48, '#8bd7e9'], [0.75, '#ffd27b'], [1, '#ef873b']]);
    drawGlow(ctx, game.width * 0.78, game.height * 0.24, game.width * 0.22, 'rgba(255,241,139,0.72)');
    ctx.fillStyle = '#ffe36a';
    ctx.strokeStyle = 'rgba(120,55,52,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(game.width * 0.78, game.height * 0.24, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawMountainBand(ctx, game, {
        baseline: game.height * 0.9, spacing: 330, minHeight: 84, heightVariation: 62, parallax: 0.08,
        fill: '#b65b54', light: '#e98b53', shadow: '#743a57', outline: 'rgba(79,34,60,0.58)', lineWidth: 4
    });

    const duneBands = [
        { y: 0.82, color: '#e99743', shadow: '#bd5c46', speed: 0.16, amp: 46 },
        { y: 0.92, color: '#f5b34d', shadow: '#d6733b', speed: 0.28, amp: 58 }
    ];
    duneBands.forEach((band, bandIndex) => {
        const offset = (game.camera.x * band.speed) % 360;
        ctx.fillStyle = band.color;
        ctx.strokeStyle = band.shadow;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-80, game.height + 10);
        for (let x = -80; x <= game.width + 120; x += 90) {
            const y = game.height * band.y - Math.sin((x + offset) / 180 + bandIndex) * band.amp;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(game.width + 100, game.height + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    for (let i = 0; i < 20; i++) {
        const x = ((i * 109 + Date.now() * 0.018 - game.camera.x * 0.12) % (game.width + 120) + game.width + 120) % (game.width + 120) - 60;
        const y = game.height * 0.56 + (i % 7) * 24;
        ctx.fillStyle = 'rgba(255,228,146,0.32)';
        ctx.fillRect(x, y, 13 + (i % 4) * 5, 2);
    }
}

function drawSky(ctx, game) {
    fillGradient(ctx, game, [[0, '#3fc5ff'], [0.48, '#8deaff'], [0.78, '#d7dcff'], [1, '#bdb2ed']]);
    drawGlow(ctx, game.width * 0.48, game.height * 0.2, game.width * 0.34, 'rgba(255,255,211,0.54)');

    ctx.save();
    const rays = ctx.createLinearGradient(0, 0, 0, game.height);
    rays.addColorStop(0, 'rgba(255,255,255,0.28)');
    rays.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rays;
    for (let i = 0; i < 5; i++) {
        const center = game.width * (0.18 + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(center - 12, 0);
        ctx.lineTo(center + 120, game.height);
        ctx.lineTo(center + 250, game.height);
        ctx.moveTo(center + 12, 0);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    const farOffset = (game.camera.x * 0.04) % 390;
    for (let i = -1; i < Math.ceil(game.width / 340) + 2; i++) {
        drawCloud(ctx, i * 360 - farOffset + 100, 90 + (i % 3) * 86, 1 + (i % 2) * 0.25, 'rgba(255,255,255,0.78)');
    }

    const islandOffset = (game.camera.x * 0.12) % 430;
    for (let i = -1; i < Math.ceil(game.width / 410) + 2; i++) {
        const x = i * 430 - islandOffset + 170;
        const y = game.height * (0.5 + (i % 2) * 0.16);
        ctx.fillStyle = '#6a58a5';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 44, y);
        ctx.quadraticCurveTo(x, y + 17, x + 44, y);
        ctx.lineTo(x + 14, y + 44);
        ctx.lineTo(x, y + 55);
        ctx.lineTo(x - 16, y + 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#b9f394';
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 46, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    drawMist(ctx, game, 'rgba(255,255,255,ALPHA)', 0.58, 0.26);
}

function drawApocalypse(ctx, game) {
    fillGradient(ctx, game, [[0, '#25142f'], [0.44, '#713047'], [0.75, '#d95038'], [1, '#ff8d3c']]);
    drawStars(ctx, game, 30, ['rgba(255,137,80,ALPHA)', 'rgba(255,214,111,ALPHA)'], 0.55, 0.018);
    drawGlow(ctx, game.width * 0.74, game.height * 0.3, game.width * 0.24, 'rgba(255,80,34,0.54)');
    ctx.fillStyle = '#ff7041';
    ctx.strokeStyle = '#3a1731';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(game.width * 0.74, game.height * 0.3, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const smokeOffset = (game.camera.x * 0.04) % 420;
    for (let i = -1; i < Math.ceil(game.width / 380) + 2; i++) {
        drawCloud(ctx, i * 400 - smokeOffset + 90, 115 + (i % 3) * 78, 1.2, 'rgba(58,31,57,0.48)', 'rgba(20,10,30,0.2)');
    }

    drawMountainBand(ctx, game, {
        baseline: game.height * 0.98, spacing: 240, minHeight: 120, heightVariation: 110, parallax: 0.12,
        fill: '#47223b', light: '#7a2f3d', shadow: '#211326', outline: OUTLINE, lineWidth: 5
    });

    const cityOffset = (game.camera.x * 0.28) % 260;
    ctx.fillStyle = '#211326';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    for (let i = -1; i < Math.ceil(game.width / 130) + 2; i++) {
        const x = i * 130 - cityOffset;
        const buildingHeight = 44 + noise(i * 7) * 90;
        ctx.fillRect(x, game.height - buildingHeight, 74, buildingHeight + 10);
        ctx.strokeRect(x, game.height - buildingHeight, 74, buildingHeight + 10);
        ctx.fillStyle = 'rgba(255,117,43,0.48)';
        for (let row = 0; row < 3; row++) ctx.fillRect(x + 13 + row * 19, game.height - buildingHeight + 18, 7, 12);
        ctx.fillStyle = '#211326';
    }

    for (let i = 0; i < 28; i++) {
        const x = ((i * 137 + Date.now() * (0.012 + i % 3 * 0.005)) % (game.width + 80)) - 40;
        const y = (game.height - ((i * 71 + Date.now() * 0.018) % game.height));
        drawGlow(ctx, x, y, 8, 'rgba(255,141,43,0.34)');
        ctx.fillStyle = '#ffc13b';
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMoon(ctx, game) {
    fillGradient(ctx, game, [[0, '#05091f'], [0.56, '#101c43'], [1, '#27365c']]);
    drawStars(ctx, game, 96, ['rgba(255,255,255,ALPHA)', 'rgba(130,215,255,ALPHA)', 'rgba(196,157,255,ALPHA)'], 0.82, 0.018);
    drawGlow(ctx, game.width * 0.78, game.height * 0.23, game.width * 0.19, 'rgba(87,157,255,0.25)');

    const planetX = game.width * 0.78;
    const planetY = game.height * 0.23;
    const planetRadius = Math.min(76, game.width * 0.08);
    const planet = ctx.createRadialGradient(planetX - planetRadius * 0.35, planetY - planetRadius * 0.35, 2, planetX, planetY, planetRadius);
    planet.addColorStop(0, '#b9f7ff');
    planet.addColorStop(0.48, '#51a8dc');
    planet.addColorStop(1, '#264f9c');
    ctx.fillStyle = planet;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const horizon = game.height * 0.78;
    const surfacePoints = getStableMoonSurfacePoints(game.width, game.camera.x, horizon);
    ctx.fillStyle = '#727a99';
    ctx.strokeStyle = '#272b4a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-20, game.height + 10);
    for (const point of surfacePoints) {
        // A altura pertence ao índice fixo do segmento no mundo. A câmera
        // desloca o segmento inteiro, sem recalcular sua silhueta a cada frame.
        ctx.lineTo(point.x, point.y);
    }
    ctx.lineTo(game.width + 80, game.height + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
        const x = ((i * 181 - game.camera.x * 0.18) % (game.width + 160) + game.width + 160) % (game.width + 160) - 80;
        const y = horizon + 20 + (i % 4) * 45;
        const radius = 10 + (i % 3) * 7;
        ctx.fillStyle = 'rgba(39,43,74,0.36)';
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.6, radius, -0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,210,230,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    drawMist(ctx, game, 'rgba(119,156,207,ALPHA)', 0.64, 0.16);
}

function drawBlackHole(ctx, game) {
    fillGradient(ctx, game, [[0, '#030515'], [0.48, '#160b36'], [0.78, '#371156'], [1, '#130b2d']]);
    drawStars(ctx, game, 110, ['rgba(255,255,255,ALPHA)', 'rgba(70,216,255,ALPHA)', 'rgba(255,91,194,ALPHA)'], 0.86, 0.012);
    const x = game.width * 0.7;
    const y = game.height * 0.36;
    const radius = Math.min(game.width, game.height) * 0.19;
    drawGlow(ctx, x, y, radius * 2.15, 'rgba(109,43,255,0.28)');
    drawGlow(ctx, x, y, radius * 1.64, 'rgba(20,208,255,0.22)');

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.24);
    for (let i = 0; i < 9; i++) {
        const t = i / 8;
        ctx.strokeStyle = i % 3 === 0
            ? `rgba(255,75,205,${0.68 - t * 0.35})`
            : (i % 3 === 1 ? `rgba(64,224,255,${0.76 - t * 0.38})` : `rgba(157,84,255,${0.72 - t * 0.36})`);
        ctx.lineWidth = 10 - t * 5;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * (1.22 + t * 0.38), radius * (0.72 + t * 0.19), 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.fillStyle = '#010106';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.9, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const rockOffset = (game.camera.x * 0.12) % 260;
    for (let i = -1; i < Math.ceil(game.width / 240) + 2; i++) {
        const rx = i * 250 - rockOffset + 90;
        const ry = game.height * (0.58 + noise(i * 4.1) * 0.28);
        const size = 8 + (i % 4 + 4) % 4 * 4;
        ctx.fillStyle = i % 2 ? '#78458c' : '#3c477e';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rx, ry - size);
        ctx.lineTo(rx + size, ry - 2);
        ctx.lineTo(rx + size * 0.35, ry + size);
        ctx.lineTo(rx - size, ry + size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    drawMist(ctx, game, 'rgba(112,36,151,ALPHA)', 0.64, 0.19);
}

const DRAWERS = {
    plains: drawPlains,
    cave: drawCave,
    ice: drawIce,
    desert: drawDesert,
    sky: drawSky,
    apocalypse: drawApocalypse,
    moon: drawMoon,
    black_hole: drawBlackHole
};

export function drawCoverBiomeBackground(ctx, game, biomeType) {
    const drawer = DRAWERS[biomeType];
    if (!drawer) return false;
    ctx.save();
    drawer(ctx, game);
    ctx.restore();
    return true;
}
