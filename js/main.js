import { game } from './game.js';
import { updateChunks, updateCamera } from './camera.js';
import { drawBackground, createParticles, initAmbientParticles, updateAmbientParticles, drawAmbientParticles } from './render.js';
import { drawDevModeUI } from './devMode.js';
import { setupMenuHandlers } from './menu.js';
import { setupInputHandlers } from './input.js';
import { FloatingText } from './entities/FloatingText.js';
import { drawModifierTimers } from './ui/ModifierTimers.js';
import { drawOffscreenBubble } from './ui/OffscreenBubble.js';
import { calculateZOrder } from './utils/Isometric.js';

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

    // Time Warp: executar updates múltiplos se algum jogador tiver time warp ativo
    let updateCount = 1;
    if ((game.player && game.player.timeWarp) || (game.player2 && game.player2.timeWarp)) {
        updateCount = 2; // 2x velocidade (acelera 100%)
    }

    // Update (executar múltiplas vezes se time warp ativo)
    for (let i = 0; i < updateCount; i++) {
        updateChunks();
        game.player.update();
        if (game.twoPlayerMode && game.player2) {
            game.player2.update();
        }
        game.coins.forEach(coin => coin.update());
        game.enemies.forEach(enemy => enemy.update());
        game.modifiers.forEach(modifier => modifier.update());

        // Atualizar projéteis
        if (game.projectiles) {
            game.projectiles.forEach(projectile => projectile.update());
            // Remover projéteis mortos
            game.projectiles = game.projectiles.filter(p => p.alive);
        }

        // Atualizar chapéus dos chunks
        game.chunks.forEach(chunk => {
            chunk.hats.forEach(hat => hat.update());
        });

        // Atualizar chapéus temporários (dropping)
        if (game.droppingHats) {
            game.droppingHats.forEach(hat => hat.update());
            // Remover chapéus coletados/expirados
            game.droppingHats = game.droppingHats.filter(hat => !hat.collected);
        }

        game.particles.forEach(particle => particle.update());
        game.floatingTexts.forEach(text => text.update());

        // Atualizar partículas ambientes
        initAmbientParticles();
        updateAmbientParticles();
    }

    // Remover partículas e textos mortos
    game.particles = game.particles.filter(p => p.life > 0);
    game.floatingTexts = game.floatingTexts.filter(t => t.life > 0);

    // Atualizar HUD
    document.getElementById('p1-score').textContent = game.player.score;
    document.getElementById('p1-hat').textContent = game.player.hatCount;
    // Cores baseadas na quantidade: 0=cinza, 1=vermelho, 2=amarelo, 3+=verde
    const p1Color = game.player.hatCount === 0 ? '#999' :
                    game.player.hatCount === 1 ? '#f44336' :
                    game.player.hatCount === 2 ? '#FFC107' : '#4CAF50';
    document.getElementById('p1-hat').style.color = p1Color;

    if (game.twoPlayerMode && game.player2) {
        document.getElementById('p2-score').textContent = game.player2.score;
        document.getElementById('p2-hat').textContent = game.player2.hatCount;
        const p2Color = game.player2.hatCount === 0 ? '#999' :
                        game.player2.hatCount === 1 ? '#f44336' :
                        game.player2.hatCount === 2 ? '#FFC107' : '#4CAF50';
        document.getElementById('p2-hat').style.color = p2Color;
    }
    document.getElementById('distance').textContent = game.distance;

    updateCamera();

    // Draw
    const ctx = game.ctx;

    // Background
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, game.width, game.height);

    drawBackground(ctx);

    // Partículas ambientes (atrás de tudo, mas na frente do background)
    drawAmbientParticles(ctx);

    // Chunks (terreno) - desenhados primeiro (camada de fundo)
    game.chunks.forEach(chunk => chunk.draw(ctx));

    // === Z-ORDERING DINÂMICO ===
    // Coletar todas as entidades que precisam de ordenação por profundidade
    const sortableEntities = [];

    // Adicionar moedas
    game.coins.forEach(coin => {
        sortableEntities.push({
            obj: coin,
            zOrder: calculateZOrder(coin.x, coin.y, coin.z || 0)
        });
    });

    // Adicionar inimigos
    game.enemies.forEach(enemy => {
        sortableEntities.push({
            obj: enemy,
            zOrder: calculateZOrder(enemy.x, enemy.y, 0)
        });
    });

    // Adicionar modificadores
    game.modifiers.forEach(modifier => {
        sortableEntities.push({
            obj: modifier,
            zOrder: calculateZOrder(modifier.x, modifier.y, 0)
        });
    });

    // Adicionar projéteis
    if (game.projectiles) {
        game.projectiles.forEach(projectile => {
            sortableEntities.push({
                obj: projectile,
                zOrder: calculateZOrder(projectile.x, projectile.y, 0)
            });
        });
    }

    // Adicionar chapéus dos chunks
    game.chunks.forEach(chunk => {
        chunk.hats.forEach(hat => {
            sortableEntities.push({
                obj: hat,
                zOrder: calculateZOrder(hat.x, hat.y, 0)
            });
        });
    });

    // Adicionar chapéus caindo
    if (game.droppingHats) {
        game.droppingHats.forEach(hat => {
            sortableEntities.push({
                obj: hat,
                zOrder: calculateZOrder(hat.x, hat.y, 0)
            });
        });
    }

    // Adicionar players
    sortableEntities.push({
        obj: game.player,
        zOrder: calculateZOrder(game.player.x, game.player.y, 0)
    });
    if (game.twoPlayerMode && game.player2) {
        sortableEntities.push({
            obj: game.player2,
            zOrder: calculateZOrder(game.player2.x, game.player2.y, 0)
        });
    }

    // Ordenar por z-order (menor primeiro = mais atrás)
    sortableEntities.sort((a, b) => a.zOrder - b.zOrder);

    // Desenhar na ordem correta
    sortableEntities.forEach(entry => entry.obj.draw(ctx));

    // Partículas por cima de tudo (exceto UI)
    game.particles.forEach(particle => particle.draw(ctx));

    // Floating texts (por cima de tudo)
    game.floatingTexts.forEach(text => text.draw(ctx));

    // Timers de modificadores (centralizados no topo)
    drawModifierTimers(ctx);

    // Bolha mostrando jogador fora da tela (modo 2 jogadores)
    drawOffscreenBubble(ctx);

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
