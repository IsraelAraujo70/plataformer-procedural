import { game } from './game.js';
import { Particle } from './entities/Particle.js';

// ============================================
// PARALLAX BACKGROUND
// ============================================

// Função principal que seleciona o background baseado no bioma com transições
export function drawBackground(ctx) {
    const currentBiomeType = game.currentBiome?.backgroundType || 'plains';
    const previousBiomeType = game.previousBiome?.backgroundType;
    const transition = game.biomeTransition;

    // Se há transição em andamento, desenhar ambos os biomas
    if (previousBiomeType && transition < 1) {
        // Desenhar bioma anterior (background)
        ctx.save();
        ctx.globalAlpha = 1 - transition;
        drawBiomeBackground(ctx, previousBiomeType);
        ctx.restore();

        // Desenhar bioma atual (foreground) com fade in
        ctx.save();
        ctx.globalAlpha = transition;
        drawBiomeBackground(ctx, currentBiomeType);
        ctx.restore();
    } else {
        // Sem transição, desenhar apenas bioma atual
        drawBiomeBackground(ctx, currentBiomeType);
    }
}

// Função auxiliar para desenhar um bioma específico
function drawBiomeBackground(ctx, biomeType) {
    switch (biomeType) {
        case 'plains':
            drawPlainsBackground(ctx);
            break;
        case 'cave':
            drawCaveBackground(ctx);
            break;
        case 'ice':
            drawIceBackground(ctx);
            break;
        case 'desert':
            drawDesertBackground(ctx);
            break;
        case 'sky':
            drawSkyBackground(ctx);
            break;
        case 'apocalypse':
            drawApocalypseBackground(ctx);
            break;
        case 'moon':
            drawMoonBackground(ctx);
            break;
        case 'black_hole':
            drawBlackHoleBackground(ctx);
            break;
        default:
            drawPlainsBackground(ctx);
    }
}

// ============================================
// PLAINS BACKGROUND (Planícies - tema original)
// ============================================
function drawPlainsBackground(ctx) {
    // Ciclo dia/noite cíclico (repete a cada 500m)
    const progression = (game.distance / 500) % 1; // 0 a 1, depois volta para 0

    // Cores do céu (ciclo completo: dia → tarde → noite → manhã → dia)
    let skyTop, skyBottom;

    if (progression < 0.25) {
        // Fase 1: Dia → Pôr do sol (0.00 - 0.25) - CORES MAIS VIBRANTES
        const t = progression * 4; // 0 a 1
        skyTop = interpolateColor('#00b4ff', '#ff5588', t); // Azul vibrante → Rosa vibrante
        skyBottom = interpolateColor('#99ddff', '#ffaa55', t); // Azul claro → Laranja vibrante
    } else if (progression < 0.5) {
        // Fase 2: Pôr do sol → Noite (0.25 - 0.50) - CORES MAIS VIBRANTES
        const t = (progression - 0.25) * 4; // 0 a 1
        skyTop = interpolateColor('#ff5588', '#1a1a3e', t); // Rosa → Azul escuro vibrante
        skyBottom = interpolateColor('#ffaa55', '#2a2a5e', t); // Laranja → Roxo escuro
    } else if (progression < 0.75) {
        // Fase 3: Noite → Amanhecer (0.50 - 0.75) - CORES MAIS VIBRANTES
        const t = (progression - 0.5) * 4; // 0 a 1
        skyTop = interpolateColor('#1a1a3e', '#ff88aa', t); // Noite → Rosa amanhecer
        skyBottom = interpolateColor('#2a2a5e', '#ffcc66', t); // Roxo escuro → Amarelo vibrante
    } else {
        // Fase 4: Amanhecer → Dia (0.75 - 1.00) - CORES MAIS VIBRANTES
        const t = (progression - 0.75) * 4; // 0 a 1
        skyTop = interpolateColor('#ff88aa', '#00b4ff', t); // Rosa → Azul vibrante
        skyBottom = interpolateColor('#ffcc66', '#99ddff', t); // Amarelo → Azul claro
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Estrelas (aparecem durante a noite: fase 0.25 - 0.75)
    if (progression >= 0.25 && progression <= 0.75) {
        let starOpacity;
        if (progression < 0.5) {
            // Aparecendo (0.25 → 0.5)
            starOpacity = (progression - 0.25) * 4; // 0 a 1
        } else {
            // Desaparecendo (0.5 → 0.75)
            starOpacity = 1 - ((progression - 0.5) * 4); // 1 a 0
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * 0.8})`;
        const starSeed = Math.floor(game.camera.x / 1000);
        for (let i = 0; i < 50; i++) {
            const x = ((i * 137 + starSeed * 73) % game.width);
            const y = ((i * 211 + starSeed * 97) % (game.height * 0.6));
            const size = 1 + (i % 3) * 0.5;
            ctx.fillRect(x, y, size, size);
        }
    }

    // Nuvens (camada mais lenta) com variação de opacidade
    const cloudParallax = game.camera.x * 0.05;
    for (let i = -1; i < 5; i++) {
        const x = i * 400 - (cloudParallax % 400);
        const y = 50 + (i % 3) * 40;
        const opacity = 0.25 + ((i % 3) * 0.1);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        drawCloud(ctx, x, y, 1 + (i % 2) * 0.3);
    }

    // Camada 1 - Montanhas distantes com neve (mais detalhadas)
    const parallax1 = game.camera.x * 0.15;
    for (let i = -1; i < 6; i++) {
        const x = i * 350 - (parallax1 % 350);
        const height = 180 + (i % 3) * 40;

        // Montanha base com gradiente
        const mountainGradient = ctx.createLinearGradient(x + 175, game.height - height, x + 175, game.height);
        mountainGradient.addColorStop(0, '#34495e');
        mountainGradient.addColorStop(0.6, '#2c3e50');
        mountainGradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = mountainGradient;
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 175, game.height - height);
        ctx.lineTo(x + 350, game.height);
        ctx.fill();

        // Pico nevado (mais brilhante)
        const snowGradient = ctx.createLinearGradient(x + 175, game.height - height, x + 175, game.height - height + 40);
        snowGradient.addColorStop(0, '#ffffff');
        snowGradient.addColorStop(1, '#e8f4f8');
        ctx.fillStyle = snowGradient;
        ctx.beginPath();
        ctx.moveTo(x + 175, game.height - height);
        ctx.lineTo(x + 140, game.height - height + 35);
        ctx.lineTo(x + 210, game.height - height + 35);
        ctx.fill();

        // Highlight no pico (brilho)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x + 175, game.height - height);
        ctx.lineTo(x + 160, game.height - height + 15);
        ctx.lineTo(x + 175, game.height - height + 20);
        ctx.fill();

        // Sombra lateral
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.moveTo(x + 175, game.height - height);
        ctx.lineTo(x + 350, game.height);
        ctx.lineTo(x + 175, game.height);
        ctx.fill();
    }

    // Camada 2 - Colinas com gradiente
    const parallax2 = game.camera.x * 0.35;
    for (let i = -1; i < 8; i++) {
        const x = i * 250 - (parallax2 % 250);
        const height = 100 + (i % 2) * 30;

        const hillGradient = ctx.createLinearGradient(x, game.height - height, x, game.height);
        hillGradient.addColorStop(0, '#34495e');
        hillGradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = hillGradient;

        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 125, game.height - height);
        ctx.lineTo(x + 250, game.height);
        ctx.fill();
    }

    // Camada 3 - Árvores com mais detalhes
    const parallax3 = game.camera.x * 0.6;
    for (let i = -1; i < 15; i++) {
        const x = i * 120 - (parallax3 % 120);
        const treeHeight = 70 + (i % 3) * 15;

        // Tronco com gradiente
        const trunkGradient = ctx.createLinearGradient(x + 45, 0, x + 55, 0);
        trunkGradient.addColorStop(0, '#654321');
        trunkGradient.addColorStop(1, '#8b6914');
        ctx.fillStyle = trunkGradient;
        ctx.fillRect(x + 45, game.height - treeHeight, 15, treeHeight);

        // Copa da árvore (3 camadas para profundidade)
        const foliageY = game.height - treeHeight;

        // Camada traseira
        ctx.fillStyle = '#1e7d45';
        ctx.beginPath();
        ctx.arc(x + 52, foliageY - 10, 28, 0, Math.PI * 2);
        ctx.fill();

        // Camada meio
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(x + 52, foliageY - 15, 25, 0, Math.PI * 2);
        ctx.fill();

        // Camada frente (highlight)
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x + 48, foliageY - 18, 18, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 4 - Arbustos no foreground
    const parallax4 = game.camera.x * 0.85;
    ctx.fillStyle = '#229954';
    for (let i = -1; i < 20; i++) {
        const x = i * 80 - (parallax4 % 80);
        const bushSize = 12 + (i % 2) * 8;
        ctx.beginPath();
        ctx.arc(x + 40, game.height - bushSize/2, bushSize, 0, Math.PI);
        ctx.fill();
    }
}

// ============================================
// CAVE BACKGROUND (Caverna/Vulcão - ambiente escuro com lava)
// ============================================
function drawCaveBackground(ctx) {
    // Céu sempre escuro (noite eterna)
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#1a0a0a');
    gradient.addColorStop(0.5, '#2d1414');
    gradient.addColorStop(1, '#3d1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Partículas de cinza/fumaça flutuantes
    const ashParallax = game.camera.x * 0.03;
    ctx.fillStyle = 'rgba(80, 80, 80, 0.15)';
    for (let i = 0; i < 40; i++) {
        const x = ((i * 137 + Math.floor(ashParallax)) % game.width);
        const y = ((i * 211 + Date.now() / 100) % game.height);
        const size = 1 + (i % 3);
        ctx.fillRect(x, y, size, size);
    }

    // Camada 1 - Vulcões distantes com lava
    const parallax1 = game.camera.x * 0.1;
    const time = Date.now() / 1000;

    for (let i = -1; i < 3; i++) {
        const x = i * 600 - (parallax1 % 600);
        const height = 300 + (i % 2) * 50;

        // Vulcão base (gradiente escuro para dar profundidade)
        const volcanoGradient = ctx.createLinearGradient(x + 300, game.height - height, x + 300, game.height);
        volcanoGradient.addColorStop(0, '#2a1a1a');
        volcanoGradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = volcanoGradient;
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 300, game.height - height);
        ctx.lineTo(x + 600, game.height);
        ctx.closePath();
        ctx.fill();

        // Brilho de lava no topo (mais sutil, sem bola)
        const craterGlow = ctx.createRadialGradient(x + 300, game.height - height + 20, 0, x + 300, game.height - height, 100);
        craterGlow.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
        craterGlow.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
        craterGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = craterGlow;
        ctx.fillRect(x + 200, game.height - height - 50, 200, 100);

        // Lava escorrendo (múltiplos rios)
        const lavaFlow1 = ctx.createLinearGradient(x + 280, game.height - height, x + 290, game.height);
        lavaFlow1.addColorStop(0, '#ff6600');
        lavaFlow1.addColorStop(0.5, '#ff3300');
        lavaFlow1.addColorStop(1, '#990000');
        ctx.fillStyle = lavaFlow1;
        ctx.beginPath();
        ctx.moveTo(x + 270, game.height - height + 15);
        ctx.lineTo(x + 285, game.height - height + 15);
        ctx.lineTo(x + 295, game.height);
        ctx.lineTo(x + 275, game.height);
        ctx.closePath();
        ctx.fill();

        // Segundo rio de lava
        const lavaFlow2 = ctx.createLinearGradient(x + 310, game.height - height, x + 320, game.height);
        lavaFlow2.addColorStop(0, '#ff6600');
        lavaFlow2.addColorStop(0.5, '#ff3300');
        lavaFlow2.addColorStop(1, '#990000');
        ctx.fillStyle = lavaFlow2;
        ctx.beginPath();
        ctx.moveTo(x + 305, game.height - height + 15);
        ctx.lineTo(x + 320, game.height - height + 15);
        ctx.lineTo(x + 330, game.height);
        ctx.lineTo(x + 310, game.height);
        ctx.closePath();
        ctx.fill();

        // Fumaça saindo do vulcão
        const pulseSmoke = Math.sin(time * 0.5 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(80, 80, 80, ${0.3 * pulseSmoke})`;
        ctx.beginPath();
        ctx.arc(x + 300, game.height - height - 20, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 280, game.height - height - 40, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 320, game.height - height - 35, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 2 - Rochas vulcânicas médias
    const parallax2 = game.camera.x * 0.25;
    for (let i = -1; i < 6; i++) {
        const x = i * 300 - (parallax2 % 300);
        const height = 120 + (i % 3) * 40;

        // Rocha escura com textura
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 100, game.height - height);
        ctx.lineTo(x + 200, game.height - height + 30);
        ctx.lineTo(x + 300, game.height);
        ctx.fill();

        // Detalhes brilhantes (magma interno)
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(x + 150, game.height - height/2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 3 - Formações rochosas próximas (estalagmites)
    const parallax3 = game.camera.x * 0.5;
    for (let i = -1; i < 15; i++) {
        const x = i * 100 - (parallax3 % 100);
        const height = 60 + (i % 4) * 20;

        // Estalagmite escura
        const rockGradient = ctx.createLinearGradient(x + 50, game.height - height, x + 50, game.height);
        rockGradient.addColorStop(0, '#3a3a3a');
        rockGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = rockGradient;
        ctx.beginPath();
        ctx.moveTo(x + 40, game.height);
        ctx.lineTo(x + 50, game.height - height);
        ctx.lineTo(x + 60, game.height);
        ctx.fill();
    }

    // Camada 4 - Poças de lava no foreground (brilho forte)
    const parallax4 = game.camera.x * 0.8;
    for (let i = -1; i < 20; i++) {
        const x = i * 120 - (parallax4 % 120);
        const poolWidth = 40 + (i % 2) * 20;

        // Brilho da lava
        const poolGlow = ctx.createRadialGradient(x + 60, game.height - 10, 0, x + 60, game.height - 10, poolWidth);
        poolGlow.addColorStop(0, '#ff9900');
        poolGlow.addColorStop(0.6, '#ff3300');
        poolGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = poolGlow;
        ctx.fillRect(x + 40, game.height - 20, poolWidth, 20);

        // Lava líquida (animada)
        const time = Date.now() / 1000;
        const wave = Math.sin(time * 2 + i) * 2;
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(x + 40, game.height - 15 + wave, poolWidth, 15);
    }
}

// ============================================
// ICE BACKGROUND (Floresta de Neve - ambiente gelado)
// ============================================
function drawIceBackground(ctx) {
    // Ciclo dia/noite cíclico (tons frios de inverno)
    const progression = (game.distance / 500) % 1;

    let skyTop, skyMiddle, skyBottom;

    if (progression < 0.25) {
        // Dia → Pôr do sol gelado
        const t = progression * 4;
        skyTop = interpolateColor('#b8d8f0', '#d4a5e8', t);
        skyMiddle = interpolateColor('#d4e8f5', '#e8c5f0', t);
        skyBottom = interpolateColor('#e8f4f8', '#f5d8f0', t);
    } else if (progression < 0.5) {
        // Pôr do sol → Noite ártica
        const t = (progression - 0.25) * 4;
        skyTop = interpolateColor('#d4a5e8', '#1a1a3e', t);
        skyMiddle = interpolateColor('#e8c5f0', '#2a2a5e', t);
        skyBottom = interpolateColor('#f5d8f0', '#3a3a7e', t);
    } else if (progression < 0.75) {
        // Noite → Aurora boreal
        const t = (progression - 0.5) * 4;
        skyTop = interpolateColor('#1a1a3e', '#4a5a8a', t);
        skyMiddle = interpolateColor('#2a2a5e', '#6a7aaa', t);
        skyBottom = interpolateColor('#3a3a7e', '#8a9aca', t);
    } else {
        // Aurora → Dia gelado
        const t = (progression - 0.75) * 4;
        skyTop = interpolateColor('#4a5a8a', '#b8d8f0', t);
        skyMiddle = interpolateColor('#6a7aaa', '#d4e8f5', t);
        skyBottom = interpolateColor('#8a9aca', '#e8f4f8', t);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(0.5, skyMiddle);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Estrelas durante a noite (fase 0.25 - 0.75)
    if (progression >= 0.25 && progression <= 0.75) {
        let starOpacity;
        if (progression < 0.5) {
            starOpacity = (progression - 0.25) * 4;
        } else {
            starOpacity = 1 - ((progression - 0.5) * 4);
        }

        ctx.fillStyle = `rgba(200, 220, 255, ${starOpacity * 0.9})`;
        const starSeed = Math.floor(game.camera.x / 1000);
        for (let i = 0; i < 60; i++) {
            const x = ((i * 137 + starSeed * 73) % game.width);
            const y = ((i * 211 + starSeed * 97) % (game.height * 0.6));
            const size = 1 + (i % 3) * 0.5;
            const twinkle = 0.6 + Math.sin(Date.now() / 400 + i) * 0.4;
            ctx.globalAlpha = starOpacity * twinkle;
            ctx.fillRect(x, y, size, size);
            ctx.globalAlpha = 1;
        }
    }

    // Aurora boreal (apenas durante fase 0.5 - 0.75)
    if (progression >= 0.45 && progression <= 0.8) {
        let auroraOpacity;
        if (progression < 0.6) {
            auroraOpacity = (progression - 0.45) * 6.67; // 0 a 1
        } else {
            auroraOpacity = 1 - ((progression - 0.6) * 5); // 1 a 0
        }

        const time = Date.now() / 3000;
        const auroraParallax = game.camera.x * 0.03;

        // Aurora verde-azulada ondulante
        for (let i = 0; i < 5; i++) {
            const x = (i * 300 - (auroraParallax % 1500)) % game.width;
            const waveOffset = Math.sin(time + i * 0.5) * 30;

            const auroraGradient = ctx.createLinearGradient(x, 50, x, 250);
            auroraGradient.addColorStop(0, `rgba(0, 255, 150, ${auroraOpacity * 0.15})`);
            auroraGradient.addColorStop(0.5, `rgba(100, 200, 255, ${auroraOpacity * 0.25})`);
            auroraGradient.addColorStop(1, `rgba(150, 100, 255, ${auroraOpacity * 0.1})`);

            ctx.fillStyle = auroraGradient;
            ctx.beginPath();
            ctx.moveTo(x, 50);
            for (let wx = 0; wx < 300; wx += 20) {
                const wy = 150 + Math.sin((wx / 50) + time + i) * 40 + waveOffset;
                ctx.lineTo(x + wx, wy);
            }
            ctx.lineTo(x + 300, 250);
            ctx.lineTo(x, 250);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Flocos de neve caindo (leves)
    const snowParallax = game.camera.x * 0.02;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const time = Date.now() / 1000;
    for (let i = 0; i < 50; i++) {
        const x = ((i * 137 + snowParallax) % game.width);
        const y = ((i * 211 + time * 30) % game.height);
        const size = 2 + (i % 2);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 1 - Montanhas nevadas distantes
    const parallax1 = game.camera.x * 0.1;
    for (let i = -1; i < 5; i++) {
        const x = i * 400 - (parallax1 % 400);
        const height = 220 + (i % 3) * 50;

        // Montanha base (cinza gelo)
        ctx.fillStyle = '#a8c5d8';
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 200, game.height - height);
        ctx.lineTo(x + 400, game.height);
        ctx.fill();

        // Neve no pico
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + 200, game.height - height);
        ctx.lineTo(x + 160, game.height - height + 50);
        ctx.lineTo(x + 240, game.height - height + 50);
        ctx.fill();

        // Sombra lateral (azul gelo)
        ctx.fillStyle = 'rgba(135, 206, 250, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x + 200, game.height - height);
        ctx.lineTo(x + 400, game.height);
        ctx.lineTo(x + 200, game.height);
        ctx.fill();
    }

    // Camada 2 - Colinas nevadas
    const parallax2 = game.camera.x * 0.3;
    for (let i = -1; i < 8; i++) {
        const x = i * 250 - (parallax2 % 250);
        const height = 100 + (i % 2) * 40;

        const hillGradient = ctx.createLinearGradient(x, game.height - height, x, game.height);
        hillGradient.addColorStop(0, '#f0f8ff');
        hillGradient.addColorStop(1, '#dceef5');
        ctx.fillStyle = hillGradient;

        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 125, game.height - height);
        ctx.lineTo(x + 250, game.height);
        ctx.fill();
    }

    // Camada 3 - Pinheiros nevados (coníferas)
    const parallax3 = game.camera.x * 0.55;
    for (let i = -1; i < 18; i++) {
        const x = i * 100 - (parallax3 % 100);
        const treeHeight = 80 + (i % 3) * 20;

        // Tronco marrom escuro
        ctx.fillStyle = '#4a3c2a';
        ctx.fillRect(x + 45, game.height - treeHeight, 10, treeHeight);

        // Copa triangular (pinheiro) com neve
        // 3 níveis de galhos
        for (let level = 0; level < 3; level++) {
            const branchY = game.height - treeHeight + (level * 20);
            const branchWidth = 40 - (level * 8);

            // Galhos verdes escuros
            ctx.fillStyle = level === 0 ? '#1e5a3a' : '#2d6e4a';
            ctx.beginPath();
            ctx.moveTo(x + 50, branchY);
            ctx.lineTo(x + 50 - branchWidth/2, branchY + 20);
            ctx.lineTo(x + 50 + branchWidth/2, branchY + 20);
            ctx.fill();

            // Neve nos galhos (topo)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x + 50, branchY);
            ctx.lineTo(x + 50 - branchWidth/4, branchY + 10);
            ctx.lineTo(x + 50 + branchWidth/4, branchY + 10);
            ctx.fill();
        }
    }

    // Camada 4 - Neve acumulada no chão (foreground)
    const parallax4 = game.camera.x * 0.8;
    ctx.fillStyle = '#ffffff';
    for (let i = -1; i < 25; i++) {
        const x = i * 70 - (parallax4 % 70);
        const snowHeight = 15 + (i % 3) * 5;

        // Pilhas de neve irregulares
        ctx.beginPath();
        ctx.ellipse(x + 35, game.height - snowHeight/2, 30, snowHeight/2, 0, 0, Math.PI);
        ctx.fill();

        // Brilho na neve
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + 25, game.height - snowHeight/2 - 3, 10, 3, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
    }
}

// ============================================
// DESERT BACKGROUND (Deserto - pirâmides e dunas)
// ============================================
function drawDesertBackground(ctx) {
    // Ciclo dia/noite no deserto (tons quentes)
    const progression = (game.distance / 500) % 1;

    let skyTop, skyMiddle, skyBottom;

    if (progression < 0.25) {
        // Dia → Pôr do sol dourado
        const t = progression * 4;
        skyTop = interpolateColor('#87ceeb', '#ff9a56', t);
        skyMiddle = interpolateColor('#b0e0e6', '#ffb370', t);
        skyBottom = interpolateColor('#e0f6ff', '#ffd98a', t);
    } else if (progression < 0.5) {
        // Pôr do sol → Noite do deserto
        const t = (progression - 0.25) * 4;
        skyTop = interpolateColor('#ff9a56', '#1a1a2e', t);
        skyMiddle = interpolateColor('#ffb370', '#2a2a4e', t);
        skyBottom = interpolateColor('#ffd98a', '#3a3a6e', t);
    } else if (progression < 0.75) {
        // Noite → Amanhecer
        const t = (progression - 0.5) * 4;
        skyTop = interpolateColor('#1a1a2e', '#ff9a56', t);
        skyMiddle = interpolateColor('#2a2a4e', '#ffb370', t);
        skyBottom = interpolateColor('#3a3a6e', '#ffd98a', t);
    } else {
        // Amanhecer → Dia
        const t = (progression - 0.75) * 4;
        skyTop = interpolateColor('#ff9a56', '#87ceeb', t);
        skyMiddle = interpolateColor('#ffb370', '#b0e0e6', t);
        skyBottom = interpolateColor('#ffd98a', '#e0f6ff', t);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(0.5, skyMiddle);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Sol/Lua
    const time = Date.now() / 1000;
    if (progression < 0.3 || progression > 0.7) {
        // Sol durante o dia
        const sunY = 100 + Math.sin(progression * Math.PI * 2) * 30;
        const sunGlow = ctx.createRadialGradient(game.width - 200, sunY, 0, game.width - 200, sunY, 100);
        sunGlow.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
        sunGlow.addColorStop(0.5, 'rgba(255, 180, 50, 0.4)');
        sunGlow.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(game.width - 200, sunY, 100, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffdb58';
        ctx.beginPath();
        ctx.arc(game.width - 200, sunY, 50, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Lua durante a noite
        ctx.fillStyle = '#f5f5dc';
        ctx.beginPath();
        ctx.arc(game.width - 250, 120, 40, 0, Math.PI * 2);
        ctx.fill();

        // Crateras da lua
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(game.width - 260, 115, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(game.width - 240, 125, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Estrelas durante a noite
    if (progression >= 0.25 && progression <= 0.75) {
        let starOpacity;
        if (progression < 0.5) {
            starOpacity = (progression - 0.25) * 4;
        } else {
            starOpacity = 1 - ((progression - 0.5) * 4);
        }

        ctx.fillStyle = `rgba(255, 255, 200, ${starOpacity * 0.9})`;
        const starSeed = Math.floor(game.camera.x / 1000);
        for (let i = 0; i < 50; i++) {
            const x = ((i * 137 + starSeed * 73) % game.width);
            const y = ((i * 211 + starSeed * 97) % (game.height * 0.5));
            const size = 1 + (i % 3) * 0.5;
            ctx.fillRect(x, y, size, size);
        }
    }

    // Camada 1 - Pirâmides distantes
    const parallax1 = game.camera.x * 0.08;
    for (let i = -1; i < 4; i++) {
        const x = i * 700 - (parallax1 % 700);
        const pyramidHeight = 200 + (i % 2) * 60;
        const pyramidWidth = 300;

        // Pirâmide principal (gradiente de areia)
        const pyramidGradient = ctx.createLinearGradient(x + pyramidWidth/2, game.height - pyramidHeight, x + pyramidWidth, game.height);
        pyramidGradient.addColorStop(0, '#e6c875');
        pyramidGradient.addColorStop(0.5, '#d4a855');
        pyramidGradient.addColorStop(1, '#b8923e');
        ctx.fillStyle = pyramidGradient;
        ctx.beginPath();
        ctx.moveTo(x + pyramidWidth/2, game.height - pyramidHeight);
        ctx.lineTo(x + pyramidWidth, game.height);
        ctx.lineTo(x + pyramidWidth/2, game.height);
        ctx.closePath();
        ctx.fill();

        // Lado esquerdo (mais escuro)
        ctx.fillStyle = '#c8a850';
        ctx.beginPath();
        ctx.moveTo(x + pyramidWidth/2, game.height - pyramidHeight);
        ctx.lineTo(x, game.height);
        ctx.lineTo(x + pyramidWidth/2, game.height);
        ctx.closePath();
        ctx.fill();

        // Linhas de blocos (detalhes)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 2;
        for (let b = 0; b < 8; b++) {
            const by = game.height - (pyramidHeight * (b / 8));
            const bw = (pyramidWidth/2) * (1 - b/8);
            ctx.beginPath();
            ctx.moveTo(x + pyramidWidth/2 - bw, by);
            ctx.lineTo(x + pyramidWidth/2 + bw, by);
            ctx.stroke();
        }

        // Topo brilhante
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(x + pyramidWidth/2, game.height - pyramidHeight);
        ctx.lineTo(x + pyramidWidth/2 - 10, game.height - pyramidHeight + 15);
        ctx.lineTo(x + pyramidWidth/2 + 10, game.height - pyramidHeight + 15);
        ctx.closePath();
        ctx.fill();
    }

    // Camada 2 - Dunas de areia médias
    const parallax2 = game.camera.x * 0.25;
    for (let i = -1; i < 8; i++) {
        const x = i * 350 - (parallax2 % 350);
        const duneHeight = 80 + (i % 3) * 30;

        const duneGradient = ctx.createLinearGradient(x, game.height - duneHeight, x, game.height);
        duneGradient.addColorStop(0, '#f4d393');
        duneGradient.addColorStop(1, '#e8b660');
        ctx.fillStyle = duneGradient;

        // Duna ondulada
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.quadraticCurveTo(x + 100, game.height - duneHeight, x + 175, game.height - duneHeight * 0.8);
        ctx.quadraticCurveTo(x + 250, game.height - duneHeight * 0.6, x + 350, game.height);
        ctx.lineTo(x, game.height);
        ctx.closePath();
        ctx.fill();

        // Sombra da duna
        ctx.fillStyle = 'rgba(180, 130, 70, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x + 175, game.height - duneHeight * 0.8);
        ctx.quadraticCurveTo(x + 250, game.height - duneHeight * 0.6, x + 350, game.height);
        ctx.lineTo(x + 175, game.height);
        ctx.closePath();
        ctx.fill();
    }

    // Camada 3 - Cactos
    const parallax3 = game.camera.x * 0.5;
    for (let i = -1; i < 15; i++) {
        const x = i * 120 - (parallax3 % 120);
        const cactusHeight = 50 + (i % 3) * 15;

        // Cacto verde escuro
        ctx.fillStyle = '#4d7c3f';
        ctx.fillRect(x + 48, game.height - cactusHeight, 8, cactusHeight);

        // Braços do cacto
        if (i % 2 === 0) {
            // Braço esquerdo
            ctx.fillRect(x + 38, game.height - cactusHeight + 15, 10, 3);
            ctx.fillRect(x + 38, game.height - cactusHeight + 15, 3, 20);

            // Braço direito
            ctx.fillRect(x + 56, game.height - cactusHeight + 25, 10, 3);
            ctx.fillRect(x + 63, game.height - cactusHeight + 25, 3, 15);
        }

        // Espinhos
        ctx.fillStyle = '#2d4c2f';
        for (let s = 0; s < cactusHeight; s += 8) {
            ctx.fillRect(x + 47, game.height - cactusHeight + s, 1, 3);
            ctx.fillRect(x + 56, game.height - cactusHeight + s + 4, 1, 3);
        }
    }

    // Camada 4 - Areia do foreground com ondas
    const parallax4 = game.camera.x * 0.85;
    ctx.fillStyle = '#f5deb3';
    for (let i = -1; i < 30; i++) {
        const x = i * 60 - (parallax4 % 60);
        const waveHeight = 8 + Math.sin(time * 0.5 + i * 0.5) * 3;

        ctx.beginPath();
        ctx.ellipse(x + 30, game.height - waveHeight/2, 25, waveHeight/2, 0, 0, Math.PI);
        ctx.fill();
    }
}

// ============================================
// SKY BACKGROUND (Céu - ambiente aéreo/celestial)
// ============================================
function drawSkyBackground(ctx) {
    // Ciclo dia/noite (similar ao plains, mas mais aéreo)
    const progression = (game.distance / 500) % 1;

    let skyTop, skyMiddle, skyBottom;

    if (progression < 0.25) {
        // Dia → Pôr do sol
        const t = progression * 4;
        skyTop = interpolateColor('#87CEEB', '#FFB347', t);
        skyMiddle = interpolateColor('#B0E0E6', '#FFC966', t);
        skyBottom = interpolateColor('#E0F6FF', '#FFD88A', t);
    } else if (progression < 0.5) {
        // Pôr do sol → Noite
        const t = (progression - 0.25) * 4;
        skyTop = interpolateColor('#FFB347', '#1a1a4e', t);
        skyMiddle = interpolateColor('#FFC966', '#2a2a6e', t);
        skyBottom = interpolateColor('#FFD88A', '#3a3a8e', t);
    } else if (progression < 0.75) {
        // Noite → Amanhecer
        const t = (progression - 0.5) * 4;
        skyTop = interpolateColor('#1a1a4e', '#FFB347', t);
        skyMiddle = interpolateColor('#2a2a6e', '#FFC966', t);
        skyBottom = interpolateColor('#3a3a8e', '#FFD88A', t);
    } else {
        // Amanhecer → Dia
        const t = (progression - 0.75) * 4;
        skyTop = interpolateColor('#FFB347', '#87CEEB', t);
        skyMiddle = interpolateColor('#FFC966', '#B0E0E6', t);
        skyBottom = interpolateColor('#FFD88A', '#E0F6FF', t);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(0.5, skyMiddle);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Estrelas (fase noturna)
    if (progression >= 0.25 && progression <= 0.75) {
        let starOpacity;
        if (progression < 0.5) {
            starOpacity = (progression - 0.25) * 4;
        } else {
            starOpacity = 1 - ((progression - 0.5) * 4);
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * 0.9})`;
        const starSeed = Math.floor(game.camera.x / 1000);
        for (let i = 0; i < 80; i++) {
            const x = ((i * 137 + starSeed * 73) % game.width);
            const y = ((i * 211 + starSeed * 97) % (game.height * 0.7));
            const size = 1 + (i % 4) * 0.5;

            // Piscar estrelas
            const twinkle = 0.5 + Math.sin(Date.now() / 300 + i) * 0.5;
            ctx.globalAlpha = starOpacity * twinkle;
            ctx.fillRect(x, y, size, size);
            ctx.globalAlpha = 1;
        }
    }

    // Camada 1 - Nuvens massivas distantes (muito lentas)
    const parallax1 = game.camera.x * 0.05;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = -1; i < 4; i++) {
        const x = i * 500 - (parallax1 % 500);
        const y = 80 + (i % 3) * 40;

        // Nuvem grande e volumosa
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.arc(x + 60, y, 50, 0, Math.PI * 2);
        ctx.arc(x + 120, y, 45, 0, Math.PI * 2);
        ctx.arc(x + 180, y, 35, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 2 - Nuvens médias flutuantes
    const parallax2 = game.camera.x * 0.15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = -1; i < 6; i++) {
        const x = i * 350 - (parallax2 % 350);
        const y = 150 + (i % 2) * 60;
        const time = Date.now() / 2000;
        const float = Math.sin(time + i) * 10;

        ctx.beginPath();
        ctx.arc(x, y + float, 25, 0, Math.PI * 2);
        ctx.arc(x + 40, y + float, 35, 0, Math.PI * 2);
        ctx.arc(x + 80, y + float, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 3 - Ilhas flutuantes melhoradas (plataformas celestiais)
    const parallax3 = game.camera.x * 0.35;
    const floatTime = Date.now() / 2000;

    for (let i = -1; i < 8; i++) {
        const baseX = i * 300 - (parallax3 % 300);
        const baseY = 300 + (i % 3) * 80;
        const islandWidth = 100 + (i % 3) * 40;
        const floatOffset = Math.sin(floatTime + i * 0.7) * 15;
        const y = baseY + floatOffset;
        const x = baseX;

        // Sombra embaixo (deslocada)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(x + islandWidth/2, baseY + 70, islandWidth/2.2, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base rochosa inferior (pedras penduradas)
        const bottomRockGradient = ctx.createLinearGradient(x, y + 20, x, y + 50);
        bottomRockGradient.addColorStop(0, '#8b7355');
        bottomRockGradient.addColorStop(1, '#5a4a3a');
        ctx.fillStyle = bottomRockGradient;
        ctx.beginPath();
        ctx.ellipse(x + islandWidth/2, y + 35, islandWidth/2.5, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base rochosa principal da ilha
        const islandGradient = ctx.createLinearGradient(x, y - 10, x, y + 30);
        islandGradient.addColorStop(0, '#a89070');
        islandGradient.addColorStop(0.6, '#8b7355');
        islandGradient.addColorStop(1, '#6a5a4a');
        ctx.fillStyle = islandGradient;

        // Formato irregular de ilha
        ctx.beginPath();
        ctx.moveTo(x + islandWidth * 0.2, y + 10);
        ctx.quadraticCurveTo(x + islandWidth/2, y - 15, x + islandWidth * 0.8, y + 10);
        ctx.quadraticCurveTo(x + islandWidth * 0.9, y + 25, x + islandWidth * 0.5, y + 20);
        ctx.quadraticCurveTo(x + islandWidth * 0.1, y + 25, x + islandWidth * 0.2, y + 10);
        ctx.closePath();
        ctx.fill();

        // Detalhes de rocha (textura)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let r = 0; r < 4; r++) {
            const rx = x + (islandWidth * 0.3) + (r * islandWidth * 0.15);
            const ry = y + 5 + ((r % 2) * 8);
            ctx.fillRect(rx, ry, 8, 6);
        }

        // Camada de grama/solo no topo
        const grassGradient = ctx.createLinearGradient(x, y - 15, x, y - 5);
        grassGradient.addColorStop(0, '#6fa865');
        grassGradient.addColorStop(1, '#52d681');
        ctx.fillStyle = grassGradient;
        ctx.beginPath();
        ctx.moveTo(x + islandWidth * 0.25, y);
        ctx.quadraticCurveTo(x + islandWidth/2, y - 18, x + islandWidth * 0.75, y);
        ctx.quadraticCurveTo(x + islandWidth * 0.8, y + 5, x + islandWidth * 0.5, y + 3);
        ctx.quadraticCurveTo(x + islandWidth * 0.2, y + 5, x + islandWidth * 0.25, y);
        ctx.closePath();
        ctx.fill();

        // Tufos de grama
        ctx.fillStyle = '#4CAF50';
        for (let g = 0; g < 5; g++) {
            const gx = x + (islandWidth * 0.3) + (g * islandWidth * 0.12);
            const gy = y - 10 + Math.sin(g * 1.5) * 3;
            ctx.fillRect(gx, gy, 3, 6);
        }

        // Árvore pequena (em algumas ilhas)
        if (i % 3 === 0) {
            const treeX = x + islandWidth * 0.6;
            const treeY = y - 12;

            // Tronco
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(treeX - 3, treeY, 6, 20);

            // Copa (3 camadas de folhagem)
            ctx.fillStyle = '#2e7d32';
            ctx.beginPath();
            ctx.arc(treeX - 6, treeY + 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.arc(treeX + 5, treeY + 1, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(treeX, treeY - 5, 11, 0, Math.PI * 2);
            ctx.fill();
        }

        // Flores (em algumas ilhas)
        if (i % 2 === 1) {
            const flowerColors = ['#ff6b9d', '#ffd93d', '#a78bfa'];
            for (let f = 0; f < 3; f++) {
                const fx = x + (islandWidth * 0.35) + (f * islandWidth * 0.15);
                const fy = y - 8;
                ctx.fillStyle = flowerColors[f % 3];
                ctx.beginPath();
                ctx.arc(fx, fy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Camada 4 - Pássaros voando
    const parallax4 = game.camera.x * 0.6;
    const birdTime = Date.now() / 400;
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    for (let i = -1; i < 15; i++) {
        const x = i * 150 - (parallax4 % 150);
        const y = 200 + (i % 4) * 100;
        const wingFlap = Math.sin(birdTime + i) * 3;

        // Asa esquerda
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - 6, y - 8 + wingFlap, x - 10, y - 4);
        ctx.stroke();

        // Asa direita
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 6, y - 8 + wingFlap, x + 10, y - 4);
        ctx.stroke();
    }

    // Camada 5 - Nuvens próximas (foreground, mais opacas)
    const parallax5 = game.camera.x * 0.85;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = -1; i < 10; i++) {
        const x = i * 200 - (parallax5 % 200);
        const y = game.height - 100 + (i % 2) * 30;

        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 45, y, 40, 0, Math.PI * 2);
        ctx.arc(x + 90, y, 35, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// APOCALYPSE BACKGROUND (Apocalipse - meteoro caindo)
// ============================================
function drawApocalypseBackground(ctx) {
    // Céu sempre escuro com tons vermelhos (apocalíptico)
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 0.5) * 0.1 + 0.9; // Pulsação lenta

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, `rgba(${Math.floor(40 * pulse)}, 10, 10, 1)`);
    gradient.addColorStop(0.5, `rgba(${Math.floor(60 * pulse)}, 20, 15, 1)`);
    gradient.addColorStop(1, `rgba(${Math.floor(80 * pulse)}, 30, 20, 1)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Meteoro massivo caindo (no fundo)
    const meteorX = game.width * 0.7;
    const meteorY = 150 + Math.sin(time * 0.3) * 20;
    const meteorSize = 120;

    // Brilho do meteoro
    const meteorGlow = ctx.createRadialGradient(meteorX, meteorY, meteorSize * 0.3, meteorX, meteorY, meteorSize * 1.5);
    meteorGlow.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
    meteorGlow.addColorStop(0.4, 'rgba(255, 80, 0, 0.5)');
    meteorGlow.addColorStop(0.7, 'rgba(200, 0, 0, 0.3)');
    meteorGlow.addColorStop(1, 'rgba(100, 0, 0, 0)');
    ctx.fillStyle = meteorGlow;
    ctx.beginPath();
    ctx.arc(meteorX, meteorY, meteorSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Corpo do meteoro (rochoso)
    const meteorBodyGradient = ctx.createRadialGradient(meteorX - 20, meteorY - 20, 0, meteorX, meteorY, meteorSize);
    meteorBodyGradient.addColorStop(0, '#ff6600');
    meteorBodyGradient.addColorStop(0.3, '#cc3300');
    meteorBodyGradient.addColorStop(0.6, '#3a2a2a');
    meteorBodyGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = meteorBodyGradient;
    ctx.beginPath();
    ctx.arc(meteorX, meteorY, meteorSize, 0, Math.PI * 2);
    ctx.fill();

    // Crateras no meteoro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = meteorSize * (0.4 + Math.random() * 0.3);
        const craterX = meteorX + Math.cos(angle) * dist;
        const craterY = meteorY + Math.sin(angle) * dist;
        const craterSize = meteorSize * (0.1 + Math.random() * 0.15);
        ctx.beginPath();
        ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Rastro de fogo atrás do meteoro
    for (let t = 0; t < 10; t++) {
        const trailX = meteorX + (t * 15);
        const trailY = meteorY - (t * 20);
        const trailSize = meteorSize * (1 - t / 12);
        const trailOpacity = (1 - t / 10) * 0.6;

        const trailGradient = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, trailSize);
        trailGradient.addColorStop(0, `rgba(255, 200, 0, ${trailOpacity})`);
        trailGradient.addColorStop(0.5, `rgba(255, 100, 0, ${trailOpacity * 0.6})`);
        trailGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fumaça/nuvens tóxicas
    const smokeParallax = game.camera.x * 0.04;
    for (let i = 0; i < 6; i++) {
        const sx = (i * 300 - (smokeParallax % 1800)) % game.width;
        const sy = 100 + (i % 3) * 80;
        const smokeSize = 60 + (i % 3) * 30;
        const smokeOpacity = 0.3 + Math.sin(time + i) * 0.1;

        ctx.fillStyle = `rgba(60, 40, 40, ${smokeOpacity})`;
        ctx.beginPath();
        ctx.arc(sx, sy, smokeSize, 0, Math.PI * 2);
        ctx.arc(sx + smokeSize * 0.8, sy, smokeSize * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }

    // Camada 1 - Montanhas destruídas (distantes)
    const parallax1 = game.camera.x * 0.12;
    for (let i = -1; i < 5; i++) {
        const x = i * 400 - (parallax1 % 400);
        const height = 160 + (i % 3) * 50;

        // Montanha quebrada
        ctx.fillStyle = '#2a1a1a';
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 100, game.height - height * 0.7);
        ctx.lineTo(x + 150, game.height - height); // Pico quebrado
        ctx.lineTo(x + 170, game.height - height * 0.8);
        ctx.lineTo(x + 250, game.height - height * 0.6);
        ctx.lineTo(x + 400, game.height);
        ctx.fill();

        // Brilho de fogo na montanha
        if (i % 2 === 0) {
            const fireGlow = ctx.createRadialGradient(x + 150, game.height - height * 0.5, 0, x + 150, game.height - height * 0.5, 60);
            fireGlow.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
            fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = fireGlow;
            ctx.fillRect(x + 100, game.height - height * 0.5, 100, 50);
        }
    }

    // Camada 2 - Prédios destruídos
    const parallax2 = game.camera.x * 0.3;
    for (let i = -1; i < 10; i++) {
        const x = i * 200 - (parallax2 % 200);
        const buildingHeight = 100 + (i % 4) * 40;
        const buildingWidth = 40 + (i % 3) * 20;

        // Prédio destruído (irregular)
        const buildingGradient = ctx.createLinearGradient(x, game.height - buildingHeight, x, game.height);
        buildingGradient.addColorStop(0, '#3a3a3a');
        buildingGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = buildingGradient;

        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x, game.height - buildingHeight);
        ctx.lineTo(x + buildingWidth * 0.3, game.height - buildingHeight * 0.9); // Topo quebrado
        ctx.lineTo(x + buildingWidth * 0.7, game.height - buildingHeight * 0.85);
        ctx.lineTo(x + buildingWidth, game.height - buildingHeight * 0.7);
        ctx.lineTo(x + buildingWidth, game.height);
        ctx.closePath();
        ctx.fill();

        // Janelas quebradas (algumas acesas)
        for (let w = 0; w < 4; w++) {
            const wy = game.height - buildingHeight * 0.6 + (w * 15);
            const isLit = Math.random() > 0.7;
            ctx.fillStyle = isLit ? '#ff6600' : '#0a0a0a';
            ctx.fillRect(x + 8, wy, 6, 8);
            ctx.fillRect(x + buildingWidth - 14, wy, 6, 8);
        }
    }

    // Camada 3 - Detritos no ar
    const parallax3 = game.camera.x * 0.6;
    ctx.fillStyle = '#4a3a3a';
    for (let i = 0; i < 20; i++) {
        const dx = (i * 100 - (parallax3 % 2000) + time * 10) % game.width;
        const dy = 200 + ((i * 137) % (game.height - 300));
        const rotation = time + i;
        const size = 8 + (i % 3) * 4;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(rotation);
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.restore();
    }

    // Camada 4 - Chamas no foreground
    const parallax4 = game.camera.x * 0.8;
    for (let i = -1; i < 15; i++) {
        const fx = i * 150 - (parallax4 % 150);
        const flameHeight = 40 + Math.sin(time * 3 + i) * 15;

        // Chamas animadas
        const flameGradient = ctx.createLinearGradient(fx, game.height - flameHeight, fx, game.height);
        flameGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        flameGradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.9)');
        flameGradient.addColorStop(1, 'rgba(200, 0, 0, 0.6)');
        ctx.fillStyle = flameGradient;

        ctx.beginPath();
        ctx.moveTo(fx + 40, game.height);
        ctx.bezierCurveTo(
            fx + 30, game.height - flameHeight * 0.6,
            fx + 35, game.height - flameHeight,
            fx + 40, game.height - flameHeight
        );
        ctx.bezierCurveTo(
            fx + 45, game.height - flameHeight,
            fx + 50, game.height - flameHeight * 0.6,
            fx + 40, game.height
        );
        ctx.closePath();
        ctx.fill();
    }
}

// ============================================
// MOON BACKGROUND (Lua - Terra sendo destruída)
// ============================================
function drawMoonBackground(ctx) {
    // Espaço negro com estrelas
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#000005');
    gradient.addColorStop(0.5, '#000510');
    gradient.addColorStop(1, '#001020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    const time = Date.now() / 1000;

    // Campo de estrelas (distante)
    ctx.fillStyle = '#ffffff';
    const starSeed = Math.floor(game.camera.x / 1000);
    for (let i = 0; i < 200; i++) {
        const x = ((i * 137 + starSeed * 73) % game.width);
        const y = ((i * 211 + starSeed * 97) % game.height);
        const size = 1 + (i % 4) * 0.5;
        const twinkle = 0.5 + Math.sin(time * 2 + i * 0.1) * 0.5;
        ctx.globalAlpha = twinkle;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Terra sendo destruída (grande, no fundo)
    const earthX = game.width * 0.25;
    const earthY = 180;
    const earthRadius = 150;

    // Atmosfera da Terra (halo azul)
    const atmosphereGlow = ctx.createRadialGradient(earthX, earthY, earthRadius * 0.95, earthX, earthY, earthRadius * 1.2);
    atmosphereGlow.addColorStop(0, 'rgba(100, 150, 255, 0)');
    atmosphereGlow.addColorStop(0.8, 'rgba(100, 180, 255, 0.3)');
    atmosphereGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.fillStyle = atmosphereGlow;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Base da Terra (parte intacta) - gradiente mais realista
    const earthGradient = ctx.createRadialGradient(earthX - 40, earthY - 40, earthRadius * 0.2, earthX, earthY, earthRadius);
    earthGradient.addColorStop(0, '#5ba3e8');
    earthGradient.addColorStop(0.4, '#4a90e2');
    earthGradient.addColorStop(0.7, '#357abd');
    earthGradient.addColorStop(0.9, '#2563a8');
    earthGradient.addColorStop(1, '#1a4d8f');
    ctx.fillStyle = earthGradient;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // Continentes (mais detalhados)
    // América do Sul
    ctx.fillStyle = '#3a7a3a';
    ctx.beginPath();
    ctx.arc(earthX - 50, earthY - 20, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d6a2d';
    ctx.beginPath();
    ctx.arc(earthX - 55, earthY - 35, 25, 0, Math.PI * 2);
    ctx.fill();

    // África/Europa
    ctx.fillStyle = '#4a8a4a';
    ctx.beginPath();
    ctx.arc(earthX + 45, earthY + 15, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a7a3a';
    ctx.beginPath();
    ctx.arc(earthX + 30, earthY - 10, 30, 0, Math.PI * 2);
    ctx.fill();

    // Ásia
    ctx.fillStyle = '#2a5a2a';
    ctx.beginPath();
    ctx.arc(earthX - 15, earthY + 55, 35, 0, Math.PI * 2);
    ctx.fill();

    // Desertos (tons marrons)
    ctx.fillStyle = 'rgba(180, 140, 90, 0.6)';
    ctx.beginPath();
    ctx.arc(earthX + 50, earthY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Nuvens na Terra (mais realistas e animadas)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + time * 0.08;
        const dist = earthRadius * (0.5 + (i % 3) * 0.15);
        const cx = earthX + Math.cos(angle) * dist;
        const cy = earthY + Math.sin(angle) * dist;
        const cloudSize = 12 + (i % 3) * 5;

        ctx.beginPath();
        ctx.arc(cx, cy, cloudSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + cloudSize * 0.6, cy, cloudSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // IMPACTO MASSIVO NA TERRA (lado direito)
    const impactAngle = Math.PI * 0.35;
    const impactX = earthX + Math.cos(impactAngle) * earthRadius * 0.6;
    const impactY = earthY + Math.sin(impactAngle) * earthRadius * 0.6;

    // Múltiplas ondas de choque da explosão (mais suaves e harmônicas)
    const explosionPulse = Math.sin(time * 2.5) * 0.5 + 0.5;
    for (let wave = 0; wave < 5; wave++) {
        const wavePhase = (time * 2 + wave * 0.5) % (Math.PI * 2);
        const wavePulse = (Math.sin(wavePhase) * 0.5 + 0.5) * 0.8;
        const waveSize = 50 + (wave * 35) + (wavePulse * 25);
        const waveOpacity = (1 - wave / 5) * (0.5 + wavePulse * 0.3);

        const shockwaveGradient = ctx.createRadialGradient(impactX, impactY, waveSize * 0.2, impactX, impactY, waveSize);
        shockwaveGradient.addColorStop(0, `rgba(255, 255, 230, ${waveOpacity * 0.9})`);
        shockwaveGradient.addColorStop(0.2, `rgba(255, 200, 100, ${waveOpacity * 0.8})`);
        shockwaveGradient.addColorStop(0.5, `rgba(255, 120, 30, ${waveOpacity * 0.6})`);
        shockwaveGradient.addColorStop(0.7, `rgba(220, 60, 20, ${waveOpacity * 0.3})`);
        shockwaveGradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
        ctx.fillStyle = shockwaveGradient;
        ctx.beginPath();
        ctx.arc(impactX, impactY, waveSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Núcleo do impacto (branco intenso com múltiplas camadas)
    // Camada externa (brilho laranja)
    const outerCoreGlow = ctx.createRadialGradient(impactX, impactY, 0, impactX, impactY, 50);
    outerCoreGlow.addColorStop(0, `rgba(255, 200, 50, ${0.7 + explosionPulse * 0.3})`);
    outerCoreGlow.addColorStop(0.5, `rgba(255, 150, 30, ${0.5 + explosionPulse * 0.2})`);
    outerCoreGlow.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = outerCoreGlow;
    ctx.beginPath();
    ctx.arc(impactX, impactY, 50, 0, Math.PI * 2);
    ctx.fill();

    // Camada intermediária (amarelo brilhante)
    const midCoreGlow = ctx.createRadialGradient(impactX, impactY, 0, impactX, impactY, 30);
    midCoreGlow.addColorStop(0, `rgba(255, 255, 200, ${0.85 + explosionPulse * 0.15})`);
    midCoreGlow.addColorStop(0.6, `rgba(255, 220, 100, ${0.7 + explosionPulse * 0.2})`);
    midCoreGlow.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = midCoreGlow;
    ctx.beginPath();
    ctx.arc(impactX, impactY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo central (branco puro pulsante)
    const innerCoreGlow = ctx.createRadialGradient(impactX, impactY, 0, impactX, impactY, 15);
    innerCoreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 + explosionPulse * 0.05})`);
    innerCoreGlow.addColorStop(0.7, `rgba(255, 255, 230, ${0.8 + explosionPulse * 0.2})`);
    innerCoreGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = innerCoreGlow;
    ctx.beginPath();
    ctx.arc(impactX, impactY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Jatos de matéria/energia saindo do impacto (mais dinâmicos e bonitos)
    for (let jet = 0; jet < 16; jet++) {
        const jetAngle = (jet / 16) * Math.PI * 2;
        const jetPhase = (time * 3 + jet * 0.5) % (Math.PI * 2);
        const jetPulse = Math.sin(jetPhase) * 0.5 + 0.5;
        const jetLength = 80 + (jet % 5) * 25 + (jetPulse * 35);
        const jetThickness = 12 - (jet % 4) * 2.5;
        const jetOpacity = 0.6 + jetPulse * 0.4;

        const jetEndX = impactX + Math.cos(jetAngle) * jetLength;
        const jetEndY = impactY + Math.sin(jetAngle) * jetLength;

        const jetGradient = ctx.createLinearGradient(impactX, impactY, jetEndX, jetEndY);
        jetGradient.addColorStop(0, `rgba(255, 240, 180, ${jetOpacity * 0.95})`);
        jetGradient.addColorStop(0.3, `rgba(255, 180, 80, ${jetOpacity * 0.8})`);
        jetGradient.addColorStop(0.6, `rgba(255, 100, 30, ${jetOpacity * 0.6})`);
        jetGradient.addColorStop(0.85, `rgba(200, 50, 20, ${jetOpacity * 0.3})`);
        jetGradient.addColorStop(1, 'rgba(120, 0, 0, 0)');

        ctx.strokeStyle = jetGradient;
        ctx.lineWidth = jetThickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(impactX, impactY);
        ctx.lineTo(jetEndX, jetEndY);
        ctx.stroke();

        // Pontos brilhantes nas pontas dos jatos (efeito de faísca)
        if (jet % 2 === 0) {
            const sparkGlow = ctx.createRadialGradient(jetEndX, jetEndY, 0, jetEndX, jetEndY, 8);
            sparkGlow.addColorStop(0, `rgba(255, 255, 200, ${jetOpacity * 0.8})`);
            sparkGlow.addColorStop(0.5, `rgba(255, 150, 50, ${jetOpacity * 0.5})`);
            sparkGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = sparkGlow;
            ctx.beginPath();
            ctx.arc(jetEndX, jetEndY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Detritos maiores e mais organizados (menos caóticos)
    for (let i = 0; i < 20; i++) {
        const debrisRing = Math.floor(i / 5); // 4 anéis de 5 detritos cada
        const debrisInRing = i % 5;
        const debrisAngle = (debrisInRing / 5) * Math.PI * 2;
        const debrisPhase = (time * 1.5 + i * 0.3) % (Math.PI * 2);
        const debrisPulse = Math.sin(debrisPhase) * 0.5 + 0.5;
        const debrisDistance = 120 + (debrisRing * 45) + (debrisPulse * 15);
        const debrisX = impactX + Math.cos(debrisAngle) * debrisDistance;
        const debrisY = impactY + Math.sin(debrisAngle) * debrisDistance;
        const debrisSize = 6 + (debrisRing % 3) * 2;
        const debrisOpacity = (1 - debrisRing / 4) * (0.7 + debrisPulse * 0.3);

        // Brilho de fogo nos detritos (mais controlado)
        const debrisGlow = ctx.createRadialGradient(debrisX, debrisY, 0, debrisX, debrisY, debrisSize * 2.5);
        debrisGlow.addColorStop(0, `rgba(255, 180, 60, ${debrisOpacity * 0.7})`);
        debrisGlow.addColorStop(0.5, `rgba(255, 100, 30, ${debrisOpacity * 0.4})`);
        debrisGlow.addColorStop(1, 'rgba(200, 50, 0, 0)');
        ctx.fillStyle = debrisGlow;
        ctx.beginPath();
        ctx.arc(debrisX, debrisY, debrisSize * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Detrito sólido (pedaços da crosta terrestre)
        const debrisColors = ['#7a5a3a', '#5a4a3a', '#4a3a2a'];
        ctx.fillStyle = debrisColors[i % 3];
        ctx.save();
        ctx.translate(debrisX, debrisY);
        ctx.rotate(time * 2 + i);
        ctx.fillRect(-debrisSize/2, -debrisSize/2, debrisSize, debrisSize);

        // Highlight no detrito (lado iluminado)
        ctx.fillStyle = `rgba(255, 150, 80, ${debrisOpacity * 0.6})`;
        ctx.fillRect(-debrisSize/3, -debrisSize/3, debrisSize/2, debrisSize/2);
        ctx.restore();
    }


    // Sol distante (pequeno e brilhante)
    const sunX = game.width - 150;
    const sunY = 100;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
    sunGlow.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    sunGlow.addColorStop(0.5, 'rgba(255, 200, 100, 0.5)');
    sunGlow.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
    ctx.fill();

    // Camada 1 - Montanhas lunares distantes
    const parallax1 = game.camera.x * 0.1;
    for (let i = -1; i < 8; i++) {
        const x = i * 300 - (parallax1 % 300);
        const mountainHeight = 150 + (i % 4) * 50;
        const mountainWidth = 200 + (i % 3) * 80;

        // Sombra da montanha
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + mountainWidth * 0.5 + 15, game.height - mountainHeight * 0.6);
        ctx.lineTo(x + mountainWidth + 20, game.height);
        ctx.closePath();
        ctx.fill();

        // Corpo da montanha (gradiente de cinza)
        const mountainGradient = ctx.createLinearGradient(x, game.height - mountainHeight, x + mountainWidth, game.height);
        mountainGradient.addColorStop(0, '#9a9a9a');
        mountainGradient.addColorStop(0.4, '#7a7a7a');
        mountainGradient.addColorStop(0.7, '#6a6a6a');
        mountainGradient.addColorStop(1, '#5a5a5a');
        ctx.fillStyle = mountainGradient;

        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + mountainWidth * 0.3, game.height - mountainHeight * 0.7);
        ctx.lineTo(x + mountainWidth * 0.5, game.height - mountainHeight);
        ctx.lineTo(x + mountainWidth * 0.7, game.height - mountainHeight * 0.8);
        ctx.lineTo(x + mountainWidth, game.height);
        ctx.closePath();
        ctx.fill();

        // Lado iluminado (esquerda - luz do sol)
        const lightGradient = ctx.createLinearGradient(x, game.height - mountainHeight, x + mountainWidth * 0.5, game.height);
        lightGradient.addColorStop(0, 'rgba(180, 180, 180, 0.6)');
        lightGradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.3)');
        lightGradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
        ctx.fillStyle = lightGradient;

        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + mountainWidth * 0.3, game.height - mountainHeight * 0.7);
        ctx.lineTo(x + mountainWidth * 0.5, game.height - mountainHeight);
        ctx.lineTo(x + mountainWidth * 0.5, game.height);
        ctx.closePath();
        ctx.fill();

        // Lado sombreado (direita)
        ctx.fillStyle = 'rgba(20, 20, 20, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x + mountainWidth * 0.5, game.height - mountainHeight);
        ctx.lineTo(x + mountainWidth * 0.7, game.height - mountainHeight * 0.8);
        ctx.lineTo(x + mountainWidth, game.height);
        ctx.lineTo(x + mountainWidth * 0.5, game.height);
        ctx.closePath();
        ctx.fill();

        // Detalhes rochosos no topo
        if (i % 2 === 0) {
            ctx.fillStyle = '#8a8a8a';
            for (let rock = 0; rock < 3; rock++) {
                const rockX = x + mountainWidth * (0.4 + rock * 0.1);
                const rockY = game.height - mountainHeight * (0.9 - rock * 0.05);
                const rockSize = 8 + rock * 3;
                ctx.beginPath();
                ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Camada 2 - Rochas lunares médias
    const parallax2 = game.camera.x * 0.3;
    for (let i = -1; i < 10; i++) {
        const x = i * 250 - (parallax2 % 250);
        const rockHeight = 60 + (i % 4) * 20;
        const rockWidth = 50 + (i % 3) * 15;

        // Rocha lunar irregular
        const rockGradient = ctx.createLinearGradient(x, game.height - rockHeight, x, game.height);
        rockGradient.addColorStop(0, '#8a8a8a');
        rockGradient.addColorStop(1, '#5a5a5a');
        ctx.fillStyle = rockGradient;

        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + rockWidth * 0.3, game.height - rockHeight);
        ctx.lineTo(x + rockWidth * 0.7, game.height - rockHeight * 0.9);
        ctx.lineTo(x + rockWidth, game.height - rockHeight * 0.6);
        ctx.lineTo(x + rockWidth, game.height);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x + rockWidth * 0.3, game.height - rockHeight);
        ctx.lineTo(x + rockWidth * 0.4, game.height - rockHeight * 0.8);
        ctx.lineTo(x + rockWidth * 0.5, game.height - rockHeight * 0.9);
        ctx.closePath();
        ctx.fill();
    }

}

// ============================================
// BLACK HOLE BACKGROUND (Buraco Negro - fase final)
// ============================================
function drawBlackHoleBackground(ctx) {
    const time = Date.now() / 1000;

    // Fundo do espaço profundo (totalmente preto)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, game.width, game.height);

    // Campo de estrelas simples
    ctx.fillStyle = '#ffffff';
    const starSeed = Math.floor(game.camera.x / 1000);
    for (let i = 0; i < 200; i++) {
        const x = ((i * 137 + starSeed * 73) % game.width);
        const y = ((i * 211 + starSeed * 97) % game.height);
        const size = 0.5 + (i % 3) * 0.5;
        const twinkle = 0.4 + Math.sin(time + i * 0.1) * 0.6;
        ctx.globalAlpha = twinkle;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Posição do buraco negro
    const blackHoleX = game.width * 0.65;
    const blackHoleY = game.height * 0.4;
    const blackHoleRadius = 90;

    // PARTE TRASEIRA DO DISCO DE ACREÇÃO (superior - círculos concêntricos achatados)
    ctx.save();
    ctx.translate(blackHoleX, blackHoleY);

    for (let layer = 0; layer < 35; layer++) {
        const radius = blackHoleRadius * 1.15 + layer * 8;
        const t = layer / 35;

        // Achatamento vertical (perspectiva)
        const verticalScale = 0.15 + (1 - t) * 0.05;

        // Gradiente de cor (vermelho escuro -> laranja -> amarelo -> branco)
        let r, g, b, a;
        if (t < 0.25) {
            r = Math.floor(100 + t * 600);
            g = Math.floor(15 + t * 180);
            b = 10;
            a = 0.25 + t * 0.5;
        } else if (t < 0.55) {
            r = 255;
            g = Math.floor(50 + (t - 0.25) * 450);
            b = 15;
            a = 0.65 + (t - 0.25) * 0.25;
        } else {
            r = 255;
            g = Math.floor(180 + (t - 0.55) * 180);
            b = Math.floor(30 + (t - 0.55) * 450);
            a = 0.85 + (t - 0.55) * 0.1;
        }

        // Desenhar parte superior do círculo (atrás do buraco negro)
        ctx.save();
        ctx.scale(1, verticalScale);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();

    // HORIZONTE DE EVENTOS (esfera preta absoluta)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(blackHoleX, blackHoleY, blackHoleRadius, 0, Math.PI * 2);
    ctx.fill();

    // ANEL DE FÓTONS (borda brilhante ao redor)
    const photonPulse = 0.7 + Math.sin(time * 2) * 0.3;
    ctx.strokeStyle = `rgba(255, 230, 200, ${photonPulse})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(blackHoleX, blackHoleY, blackHoleRadius + 1, 0, Math.PI * 2);
    ctx.stroke();

    // PARTE FRONTAL DO DISCO DE ACREÇÃO (inferior - círculos concêntricos achatados)
    ctx.save();
    ctx.translate(blackHoleX, blackHoleY);

    for (let layer = 0; layer < 35; layer++) {
        const radius = blackHoleRadius * 1.15 + layer * 8;
        const t = layer / 35;

        // Achatamento vertical (perspectiva)
        const verticalScale = 0.15 + (1 - t) * 0.05;

        // Gradiente de cor (vermelho escuro -> laranja -> amarelo -> branco)
        let r, g, b, a;
        if (t < 0.25) {
            r = Math.floor(100 + t * 600);
            g = Math.floor(15 + t * 180);
            b = 10;
            a = 0.25 + t * 0.5;
        } else if (t < 0.55) {
            r = 255;
            g = Math.floor(50 + (t - 0.25) * 450);
            b = 15;
            a = 0.65 + (t - 0.25) * 0.25;
        } else {
            r = 255;
            g = Math.floor(180 + (t - 0.55) * 180);
            b = Math.floor(30 + (t - 0.55) * 450);
            a = 0.85 + (t - 0.55) * 0.1;
        }

        // Desenhar parte inferior do círculo (na frente do buraco negro)
        ctx.save();
        ctx.scale(1, verticalScale);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();

    // BRILHO INTENSO ao redor do disco interno
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const innerGlow = ctx.createRadialGradient(blackHoleX, blackHoleY, blackHoleRadius, blackHoleX, blackHoleY, blackHoleRadius * 2.2);
    innerGlow.addColorStop(0, 'rgba(255, 240, 220, 0.5)');
    innerGlow.addColorStop(0.3, 'rgba(255, 180, 100, 0.3)');
    innerGlow.addColorStop(0.6, 'rgba(255, 120, 50, 0.15)');
    innerGlow.addColorStop(1, 'rgba(200, 60, 20, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(blackHoleX, blackHoleY, blackHoleRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // EFEITOS DE LENTE GRAVITACIONAL (anéis sutis)
    for (let ring = 0; ring < 2; ring++) {
        const ringRadius = blackHoleRadius * (1.15 + ring * 0.2);
        const ringOpacity = (0.2 - ring * 0.08) * photonPulse;

        ctx.strokeStyle = `rgba(255, 220, 180, ${ringOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(blackHoleX, blackHoleY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // OBJETOS SENDO SUGADOS PARA O BURACO NEGRO (asteroides, destroços, etc)
    for (let i = 0; i < 30; i++) {
        const progress = (time * 0.12 + i * 0.35) % 1; // 0 a 1 (bordas da tela até horizonte)

        // Ângulo inicial fixo para cada objeto (de onde ele vem)
        const startAngle = (i / 30) * Math.PI * 2;

        // Distância das bordas da tela até o horizonte de eventos
        const screenMaxDistance = Math.max(game.width, game.height) * 0.8;
        const eventHorizonRadius = blackHoleRadius + 2; // Onde toca o anel de fótons
        const distance = screenMaxDistance - (progress * (screenMaxDistance - eventHorizonRadius));

        // Leve curvatura em espiral conforme se aproxima
        const spiralEffect = (1 - progress) * 0.5; // Reduz a espiral
        const angle = startAngle + progress * Math.PI * spiralEffect;

        const objX = blackHoleX + Math.cos(angle) * distance;
        const objY = blackHoleY + Math.sin(angle) * distance;

        // Tamanho diminui conforme se aproxima (perspectiva)
        const baseSize = 6 + (i % 4) * 3;
        const size = baseSize * (1 - progress * 0.6);

        // Opacidade: desaparece ANTES de tocar o horizonte de eventos
        let opacity;
        if (progress < 0.05) {
            opacity = progress / 0.05; // Fade in rápido
        } else if (progress > 0.92) {
            // Desaparece quando está próximo do horizonte de eventos
            opacity = (1 - progress) / 0.08;
        } else {
            opacity = 1;
        }

        // Não desenhar se já passou do horizonte de eventos
        if (distance <= eventHorizonRadius) {
            continue;
        }

        // Tipo de objeto (alterna entre diferentes tipos)
        const objectType = i % 4;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(objX, objY);
        ctx.rotate(time * 2 + i);

        switch (objectType) {
            case 0: // Asteroide (rochoso)
                // Corpo do asteroide
                ctx.fillStyle = '#8b7355';
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();

                // Crateras
                ctx.fillStyle = 'rgba(50, 40, 30, 0.5)';
                ctx.beginPath();
                ctx.arc(size * 0.3, -size * 0.2, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-size * 0.3, size * 0.3, size * 0.25, 0, Math.PI * 2);
                ctx.fill();

                // Brilho
                ctx.fillStyle = 'rgba(200, 180, 150, 0.3)';
                ctx.beginPath();
                ctx.arc(-size * 0.3, -size * 0.3, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 1: // Fragmento metálico
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(-size/2, -size/2, size, size);

                // Detalhes metálicos
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fillRect(-size/3, -size/3, size/2, size/3);

                ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                ctx.fillRect(0, 0, size/2, size/2);
                break;

            case 2: // Rocha espacial angular
                ctx.fillStyle = '#6b5a4a';
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.8, -size * 0.3);
                ctx.lineTo(size * 0.6, size * 0.7);
                ctx.lineTo(-size * 0.5, size * 0.5);
                ctx.lineTo(-size * 0.7, -size * 0.4);
                ctx.closePath();
                ctx.fill();

                // Highlight
                ctx.fillStyle = 'rgba(150, 130, 110, 0.4)';
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.4, -size * 0.5);
                ctx.lineTo(size * 0.2, 0);
                ctx.closePath();
                ctx.fill();
                break;

            case 3: // Detrito brilhante (gelo/cristal)
                // Brilho externo
                const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
                glowGradient.addColorStop(0, 'rgba(150, 200, 255, 0.4)');
                glowGradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.2)');
                glowGradient.addColorStop(1, 'rgba(50, 100, 200, 0)');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
                ctx.fill();

                // Núcleo cristalino
                ctx.fillStyle = '#b0d4ff';
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.fill();

                // Brilho central
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(-size * 0.2, -size * 0.2, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        // Rastro de distorção (efeito de spaghettification) - apenas próximo ao horizonte
        if (progress > 0.8) {
            const distortionIntensity = (progress - 0.8) / 0.2; // 0 a 1
            const distortionLength = distortionIntensity * 40;
            const distortionAngle = angle + Math.PI;

            ctx.globalAlpha = opacity * 0.6 * distortionIntensity;
            ctx.strokeStyle = objectType === 3 ? 'rgba(150, 200, 255, 0.5)' : 'rgba(255, 180, 100, 0.4)';
            ctx.lineWidth = size * 0.4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(distortionAngle) * distortionLength, Math.sin(distortionAngle) * distortionLength);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Função auxiliar para desenhar nuvens
function drawCloud(ctx, x, y, scale) {
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25 * scale, y, 30 * scale, 0, Math.PI * 2);
    ctx.arc(x + 50 * scale, y, 25 * scale, 0, Math.PI * 2);
    ctx.arc(x + 70 * scale, y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
}

// Função auxiliar para interpolar cores
function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// ============================================
// AMBIENT PARTICLES (Partículas de ambiente)
// ============================================
export function initAmbientParticles() {
    if (!game.ambientParticles) {
        game.ambientParticles = [];
    }

    const biomeType = game.currentBiome?.backgroundType || 'plains';
    let targetCount = 30;
    let particleTypes = ['dust', 'leaf'];

    // Customizar tipos de partículas por bioma
    switch (biomeType) {
        case 'plains':
            particleTypes = ['dust', 'leaf'];
            targetCount = 30;
            break;
        case 'cave':
            particleTypes = ['ember', 'smoke', 'ash'];
            targetCount = 40;
            break;
        case 'ice':
            particleTypes = ['snowflake', 'ice_dust'];
            targetCount = 50;
            break;
        case 'desert':
            particleTypes = ['sand', 'heat_wave'];
            targetCount = 35;
            break;
        case 'sky':
            particleTypes = ['cloud_dust', 'feather'];
            targetCount = 35;
            break;
        case 'apocalypse':
            particleTypes = ['ember', 'ash', 'debris'];
            targetCount = 45;
            break;
        case 'moon':
            particleTypes = ['moon_dust', 'star_dust'];
            targetCount = 25;
            break;
        case 'black_hole':
            particleTypes = ['void_dust', 'energy_particle', 'graviton'];
            targetCount = 50;
            break;
    }

    // Manter cerca de N partículas no ar (baseado no bioma)
    while (game.ambientParticles.length < targetCount) {
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];

        game.ambientParticles.push({
            x: Math.random() * game.width + game.camera.x,
            y: Math.random() * game.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: type === 'ember' ? -(Math.random() * 0.5 + 0.2) : (Math.random() - 0.5) * 0.3,
            size: 1 + Math.random() * 2,
            opacity: 0.2 + Math.random() * 0.3,
            type: type,
            rotation: Math.random() * Math.PI * 2
        });
    }
}

export function updateAmbientParticles() {
    if (!game.ambientParticles) return;

    game.ambientParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Movimento senoidal (flutuante)
        p.y += Math.sin(Date.now() / 1000 + p.x) * 0.1;

        // Remover partículas fora da tela
        if (p.x < game.camera.x - 100 || p.x > game.camera.x + game.width + 100 ||
            p.y < -50 || p.y > game.height + 50) {
            p.x = Math.random() * game.width + game.camera.x;
            p.y = Math.random() > 0.5 ? -10 : game.height + 10;
        }
    });
}

export function drawAmbientParticles(ctx) {
    if (!game.ambientParticles) return;

    game.ambientParticles.forEach(p => {
        const screenX = p.x - game.camera.x;
        const screenY = p.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        switch (p.type) {
            case 'dust':
                // Partícula de poeira
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fillRect(0, 0, p.size, p.size);
                break;

            case 'leaf':
                // Folha caindo
                ctx.fillStyle = `rgba(76, 175, 80, ${p.opacity})`;
                ctx.rotate(Date.now() / 500 + p.x);
                ctx.fillRect(-p.size, -p.size/2, p.size * 2, p.size);
                break;

            case 'ember':
                // Brasas subindo (cave)
                const emberGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
                emberGlow.addColorStop(0, `rgba(255, 120, 0, ${p.opacity})`);
                emberGlow.addColorStop(0.5, `rgba(255, 60, 0, ${p.opacity * 0.6})`);
                emberGlow.addColorStop(1, `rgba(255, 0, 0, 0)`);
                ctx.fillStyle = emberGlow;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'smoke':
                // Fumaça (cave)
                ctx.fillStyle = `rgba(100, 100, 100, ${p.opacity * 0.4})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'ash':
                // Cinzas (cave)
                ctx.fillStyle = `rgba(150, 150, 150, ${p.opacity})`;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                break;

            case 'snowflake':
                // Floco de neve (ice)
                ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI / 3) + p.rotation;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * p.size * 2, Math.sin(angle) * p.size * 2);
                    ctx.stroke();
                }
                break;

            case 'ice_dust':
                // Poeira de gelo (ice)
                ctx.fillStyle = `rgba(200, 230, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'cloud_dust':
                // Poeira de nuvem (sky)
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'feather':
                // Pena flutuante (sky)
                ctx.fillStyle = `rgba(240, 240, 240, ${p.opacity})`;
                ctx.rotate(p.rotation + Date.now() / 1000);
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 2, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'sand':
                // Grão de areia (desert)
                ctx.fillStyle = `rgba(245, 222, 179, ${p.opacity})`;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                break;

            case 'heat_wave':
                // Onda de calor (desert) - ondulação
                ctx.strokeStyle = `rgba(255, 200, 100, ${p.opacity * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const waveTime = Date.now() / 500;
                ctx.moveTo(-10, 0);
                ctx.quadraticCurveTo(-5, Math.sin(waveTime + p.x) * 5, 0, 0);
                ctx.quadraticCurveTo(5, -Math.sin(waveTime + p.x) * 5, 10, 0);
                ctx.stroke();
                break;

            case 'debris':
                // Detritos (apocalypse)
                ctx.fillStyle = `rgba(100, 80, 80, ${p.opacity})`;
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.size/2, -p.size/2, p.size * 1.5, p.size);
                break;

            case 'moon_dust':
                // Poeira lunar (moon)
                ctx.fillStyle = `rgba(180, 180, 180, ${p.opacity * 0.6})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star_dust':
                // Poeira estelar (moon)
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                for (let s = 0; s < 4; s++) {
                    const angle = (s * Math.PI / 2) + p.rotation;
                    const sx = Math.cos(angle) * p.size;
                    const sy = Math.sin(angle) * p.size;
                    ctx.fillRect(sx - 0.5, sy - 0.5, 1, p.size);
                }
                break;

            case 'void_dust':
                // Poeira do vazio (black hole) - roxo escuro
                ctx.fillStyle = `rgba(88, 24, 69, ${p.opacity * 0.7})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(120, 50, 100, ${p.opacity * 0.4})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'energy_particle':
                // Partícula de energia (black hole) - laranja/azul
                const energyColor = p.rotation % 2 < 1 ?
                    `rgba(255, 150, 80, ${p.opacity})` :
                    `rgba(100, 150, 255, ${p.opacity})`;
                ctx.fillStyle = energyColor;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                // Brilho
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'graviton':
                // Gráviton (black hole) - distorção espacial
                ctx.strokeStyle = `rgba(150, 180, 255, ${p.opacity * 0.6})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity * 0.8})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fillRect(0, 0, p.size, p.size);
        }

        ctx.restore();
    });
}

// ============================================
// PARALLAX ANIMADO MULTI-CAMADAS
// ============================================

// Sistema de partículas de neve para bioma Ice
let snowParticles = [];

export function drawParallaxLayers(ctx) {
    const currentBiome = game.currentBiome?.name || 'Plains';

    // Desenhar camadas baseadas no bioma
    switch(currentBiome) {
        case 'Plains':
            drawPlainsParallax(ctx);
            break;
        case 'Sky':
            drawSkyParallax(ctx);
            break;
        case 'Ice':
            drawIceParallax(ctx);
            break;
        case 'Cave':
            drawCaveParallax(ctx);
            break;
        case 'Desert':
            drawDesertParallax(ctx);
            break;
        // Outros biomas podem ser adicionados futuramente
    }
}

// ============================================
// PLAINS PARALLAX - Nuvens e Pássaros
// ============================================
function drawPlainsParallax(ctx) {
    const time = Date.now() / 1000;

    // CAMADA 1: Nuvens distantes (50% velocidade câmera)
    const cloudOffset = (game.camera.x * 0.5) % 400;
    for (let i = -1; i < 5; i++) {
        const x = i * 400 - cloudOffset;
        const y = 50 + Math.sin(time * 0.3 + i) * 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        drawCloud(ctx, x, y, 0.8);
    }

    // CAMADA 2: Pássaros voando (30% velocidade câmera)
    const birdOffset = (game.camera.x * 0.3) % 600;
    for (let i = 0; i < 3; i++) {
        const x = i * 600 - birdOffset + Math.sin(time + i * 2) * 50;
        const y = 100 + Math.cos(time * 0.5 + i) * 30;
        const wingFlap = Math.sin(time * 5 + i) > 0;
        drawBird(ctx, x, y, wingFlap);
    }
}

// ============================================
// SKY PARALLAX - Nuvens Próximas
// ============================================
function drawSkyParallax(ctx) {
    const time = Date.now() / 1000;

    // Nuvens grandes e próximas (70% velocidade)
    const cloudOffset = (game.camera.x * 0.7) % 300;
    for (let i = -1; i < 6; i++) {
        const x = i * 300 - cloudOffset;
        const y = 100 + Math.sin(time * 0.5 + i) * 20;
        const size = 1.2 + Math.sin(i) * 0.4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawCloud(ctx, x, y, size);
    }
}

// ============================================
// ICE PARALLAX - Neve Caindo
// ============================================
function drawIceParallax(ctx) {
    const time = Date.now();

    // Criar neve periodicamente
    if (snowParticles.length < 100 && Math.random() < 0.3) {
        snowParticles.push({
            x: Math.random() * game.width + game.camera.x,
            y: game.camera.y - 10,
            speed: Math.random() * 1 + 0.5,
            size: Math.random() * 3 + 1,
            sway: Math.random() * 0.5
        });
    }

    // Atualizar e desenhar neve
    snowParticles = snowParticles.filter(snow => {
        snow.y += snow.speed * game.deltaTimeFactor;
        snow.x += Math.sin(time / 500 + snow.y) * snow.sway * game.deltaTimeFactor;

        const screenX = snow.x - game.camera.x;
        const screenY = snow.y - game.camera.y;

        if (screenY < game.height + 20) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, snow.size, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }
        return false;
    });
}

// ============================================
// CAVE PARALLAX - Morcegos e Fireflies
// ============================================
function drawCaveParallax(ctx) {
    const time = Date.now() / 1000;

    // Morcegos voando
    const batOffset = (game.camera.x * 0.4) % 500;
    for (let i = 0; i < 2; i++) {
        const x = i * 500 - batOffset + Math.sin(time * 2 + i * 3) * 80;
        const y = 80 + Math.sin(time * 3 + i) * 40;
        const wingFlap = Math.sin(time * 8 + i) > 0;
        drawBat(ctx, x, y, wingFlap);
    }

    // Partículas de poeira brilhante (fireflies)
    for (let i = 0; i < 15; i++) {
        const x = ((i * 100 + time * 20) % (game.width + 200)) + game.camera.x - 100;
        const y = 100 + Math.sin(time + i) * 80;
        const opacity = 0.3 + Math.sin(time * 3 + i) * 0.3;

        const screenX = x - game.camera.x;
        const screenY = y;

        ctx.fillStyle = `rgba(255, 215, 100, ${opacity})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// DESERT PARALLAX - Areia Flutuante
// ============================================
function drawDesertParallax(ctx) {
    const time = Date.now() / 1000;

    // Partículas de areia no vento
    for (let i = 0; i < 20; i++) {
        const x = ((i * 80 + time * 60) % (game.width + 200)) + game.camera.x - 100;
        const y = game.height - 100 + Math.sin(time * 2 + i) * 40;
        const opacity = 0.2 + Math.sin(time * 4 + i) * 0.2;

        const screenX = x - game.camera.x;
        const screenY = y - game.camera.y;

        ctx.fillStyle = `rgba(218, 165, 32, ${opacity})`;
        ctx.fillRect(screenX, screenY, 3, 1);
    }
}

// ============================================
// FUNÇÕES AUXILIARES DE DESENHO
// ============================================

function drawBird(ctx, x, y, wingUp) {
    const screenX = x - game.camera.x;
    const screenY = y;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();

    const wingOffset = wingUp ? -3 : 3;
    ctx.moveTo(screenX - 8, screenY + wingOffset);
    ctx.quadraticCurveTo(screenX - 4, screenY - 5, screenX, screenY);
    ctx.quadraticCurveTo(screenX + 4, screenY - 5, screenX + 8, screenY + wingOffset);
    ctx.stroke();
}

function drawBat(ctx, x, y, wingUp) {
    const screenX = x - game.camera.x;
    const screenY = y;

    ctx.fillStyle = 'rgba(80, 60, 100, 0.7)';
    const wingOffset = wingUp ? -4 : 2;

    // Asa esquerda
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX - 6, screenY + wingOffset);
    ctx.lineTo(screenX - 3, screenY);
    ctx.fill();

    // Asa direita
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + 6, screenY + wingOffset);
    ctx.lineTo(screenX + 3, screenY);
    ctx.fill();

    // Corpo
    ctx.fillStyle = 'rgba(60, 40, 80, 0.8)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================
// PARTICLES
// ============================================
export function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push(new Particle(x, y, color));
    }
}
