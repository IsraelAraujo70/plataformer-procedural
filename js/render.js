import { game } from './game.js';
import { Particle } from './entities/Particle.js';

// ============================================
// PARALLAX BACKGROUND
// ============================================
export function drawBackground(ctx) {
    // Camada 1 - Mais distante (montanhas)
    const parallax1 = game.camera.x * 0.2;
    ctx.fillStyle = '#2c3e50';
    for (let i = -1; i < 6; i++) {
        const x = i * 300 - (parallax1 % 300);
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 150, game.height - 200);
        ctx.lineTo(x + 300, game.height);
        ctx.fill();
    }

    // Camada 2 - Meio (colinas)
    const parallax2 = game.camera.x * 0.4;
    ctx.fillStyle = '#34495e';
    for (let i = -1; i < 8; i++) {
        const x = i * 200 - (parallax2 % 200);
        ctx.beginPath();
        ctx.moveTo(x, game.height);
        ctx.lineTo(x + 100, game.height - 120);
        ctx.lineTo(x + 200, game.height);
        ctx.fill();
    }

    // Camada 3 - Frente (árvores)
    const parallax3 = game.camera.x * 0.7;
    ctx.fillStyle = '#27ae60';
    for (let i = -1; i < 15; i++) {
        const x = i * 100 - (parallax3 % 100);
        ctx.fillRect(x + 40, game.height - 80, 20, 80);
        ctx.fillStyle = '#229954';
        ctx.beginPath();
        ctx.arc(x + 50, game.height - 80, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27ae60';
    }
}

// ============================================
// PARTICLES
// ============================================
export function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push(new Particle(x, y, color));
    }
}
