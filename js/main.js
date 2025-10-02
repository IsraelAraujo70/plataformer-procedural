import { game } from './game.js';
import { updateChunks, updateCamera } from './camera.js';
import { drawBackground, createParticles } from './render.js';
import { drawDevModeUI } from './devMode.js';
import { setupMenuHandlers } from './menu.js';
import { setupInputHandlers } from './input.js';
import { FloatingText } from './entities/FloatingText.js';
import { drawModifierTimers } from './ui/ModifierTimers.js';

// ============================================
// HELPERS GLOBAIS
// ============================================

// Helper para criar textos flutuantes
export function createFloatingText(text, x, y, color) {
    game.floatingTexts.push(new FloatingText(text, x, y, color));
}

// Expor funções globalmente para serem usadas pelas entidades
window.createFloatingText = createFloatingText;
window.createParticles = createParticles;

// ============================================
// GAME LOOP
// ============================================
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    if (game.state !== 'playing') return;

    // Delta time
    game.deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    // Update
    updateChunks();
    game.player.update();
    if (game.twoPlayerMode && game.player2) {
        game.player2.update();
    }
    game.coins.forEach(coin => coin.update());
    game.enemies.forEach(enemy => enemy.update());
    game.modifiers.forEach(modifier => modifier.update());
    game.particles.forEach(particle => particle.update());
    game.floatingTexts.forEach(text => text.update());

    // Remover partículas e textos mortos
    game.particles = game.particles.filter(p => p.life > 0);
    game.floatingTexts = game.floatingTexts.filter(t => t.life > 0);

    // Atualizar HUD
    document.getElementById('p1-score').textContent = game.player.score;
    if (game.twoPlayerMode && game.player2) {
        document.getElementById('p2-score').textContent = game.player2.score;
    }
    document.getElementById('distance').textContent = game.distance;

    updateCamera();

    // Draw
    const ctx = game.ctx;

    // Background
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, game.width, game.height);

    drawBackground(ctx);

    // Chunks (terreno)
    game.chunks.forEach(chunk => chunk.draw(ctx));

    // Entities
    game.coins.forEach(coin => coin.draw(ctx));
    game.enemies.forEach(enemy => enemy.draw(ctx));
    game.modifiers.forEach(modifier => modifier.draw(ctx));
    game.particles.forEach(particle => particle.draw(ctx));

    // Players
    game.player.draw(ctx);
    if (game.twoPlayerMode && game.player2) {
        game.player2.draw(ctx);
    }

    // Floating texts (por cima de tudo)
    game.floatingTexts.forEach(text => text.draw(ctx));

    // Timers de modificadores (centralizados no topo)
    drawModifierTimers(ctx);

    // Dev Mode UI (por cima de absolutamente tudo)
    drawDevModeUI(ctx);
}

// ============================================
// CANVAS RESPONSIVO (TELA CHEIA)
// ============================================
function resizeCanvas() {
    // Canvas sempre em tela cheia
    game.canvas.width = game.width;
    game.canvas.height = game.height;
    game.canvas.style.width = '100vw';
    game.canvas.style.height = '100vh';
}

// ============================================
// INICIALIZAÇÃO
// ============================================
window.addEventListener('load', () => {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Configurar canvas responsivo
    resizeCanvas();

    // Configurar handlers
    setupMenuHandlers();
    setupInputHandlers();

    // Começar o loop (mesmo no menu, para possíveis animações)
    requestAnimationFrame(gameLoop);
});

// Redimensionar quando a janela mudar de tamanho
window.addEventListener('resize', resizeCanvas);
