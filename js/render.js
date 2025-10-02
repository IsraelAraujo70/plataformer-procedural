import { game } from './game.js';
import { Particle } from './entities/Particle.js';

// ============================================
// PARALLAX BACKGROUND
// ============================================
export function drawBackground(ctx) {
    // Gradiente de céu dinâmico baseado na progressão
    const progression = Math.min(game.distance / 500, 1); // 0 a 1 ao longo de 500m

    // Cores do céu (transição: dia → pôr do sol → noite)
    let skyTop, skyBottom;
    if (progression < 0.5) {
        // Dia → Pôr do sol
        const t = progression * 2;
        skyTop = interpolateColor('#87CEEB', '#FF6B6B', t);
        skyBottom = interpolateColor('#E0F6FF', '#FFB347', t);
    } else {
        // Pôr do sol → Noite
        const t = (progression - 0.5) * 2;
        skyTop = interpolateColor('#FF6B6B', '#1a1a2e', t);
        skyBottom = interpolateColor('#FFB347', '#16213e', t);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Estrelas (aparecem gradualmente à noite)
    if (progression > 0.5) {
        const starOpacity = (progression - 0.5) * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * 0.8})`;
        const starSeed = Math.floor(game.camera.x / 1000);
        for (let i = 0; i < 50; i++) {
            const x = ((i * 137 + starSeed * 73) % game.width);
            const y = ((i * 211 + starSeed * 97) % (game.height * 0.6));
            const size = 1 + (i % 3) * 0.5;
            ctx.fillRect(x, y, size, size);
        }
    }

    // Nuvens (camada mais lenta)
    const cloudParallax = game.camera.x * 0.05;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = -1; i < 4; i++) {
        const x = i * 400 - (cloudParallax % 400);
        const y = 50 + (i % 2) * 30;
        drawCloud(ctx, x, y, 1);
    }

    // Camada 1 - Montanhas distantes com neve
    const parallax1 = game.camera.x * 0.15;
    for (let i = -1; i < 6; i++) {
        const x = i * 350 - (parallax1 % 350);
        const height = 180 + (i % 3) * 40;

        // Montanha base
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 175, game.height - height);
        ctx.lineTo(x + 350, game.height);
        ctx.fill();

        // Pico nevado
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.moveTo(x + 175, game.height - height);
        ctx.lineTo(x + 145, game.height - height + 30);
        ctx.lineTo(x + 205, game.height - height + 30);
        ctx.fill();

        // Sombra lateral
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
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

    // Manter cerca de 30 partículas no ar
    while (game.ambientParticles.length < 30) {
        game.ambientParticles.push({
            x: Math.random() * game.width + game.camera.x,
            y: Math.random() * game.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: 1 + Math.random() * 2,
            opacity: 0.2 + Math.random() * 0.3,
            type: Math.random() > 0.5 ? 'dust' : 'leaf'
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

        if (p.type === 'dust') {
            // Partícula de poeira
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fillRect(screenX, screenY, p.size, p.size);
        } else {
            // Folha caindo
            ctx.fillStyle = `rgba(76, 175, 80, ${p.opacity})`;
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(Date.now() / 500 + p.x);
            ctx.fillRect(-p.size, -p.size/2, p.size * 2, p.size);
            ctx.restore();
        }
    });
}

// ============================================
// PARTICLES
// ============================================
export function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push(new Particle(x, y, color));
    }
}
