import { game } from './game.js';
import { updateChunks, updateCamera } from './camera.js';
import { drawBackground, drawParallaxLayers, createParticles, initAmbientParticles, updateAmbientParticles, drawAmbientParticles } from './render.js';
import { drawDevModeUI } from './devMode.js';
import { setupMenuHandlers } from './menu.js';
import { setupInputHandlers } from './input.js';
import { FloatingText } from './entities/FloatingText.js';
import { drawModifierTimers } from './ui/ModifierTimers.js';
import { drawOffscreenBubble } from './ui/OffscreenBubble.js';
import { CONFIG } from './config.js';
import { getBiome } from './world/Patterns.js';
import { rewardedAdsManager } from './ads/RewardedAds.js';
import { setupContinueModal, resetContinueFlag } from './ui/ContinueModal.js';
import { soundManager } from './audio/SoundManager.js';
import { initializeNewSystems, updateNewSystems, renderNewSystems, applyCameraTransform, restoreCameraTransform, renderDebugStats } from './integration.js';

let uiElements = null;

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

    const targetFrameTime = 1000 / 60; // ~16.67ms

    if (game.state !== 'playing') {
        game.lastTime = currentTime;
        game.deltaTime = targetFrameTime;
        game.deltaTimeFactor = 1;
        return;
    }

    if (!game.lastTime) {
        game.lastTime = currentTime;
        game.deltaTime = targetFrameTime;
        game.deltaTimeFactor = 1;
        return;
    }

    // Delta time - normalizado para 60 FPS
    let frameDelta = currentTime - game.lastTime;
    game.lastTime = currentTime;

    if (frameDelta < 0) {
        frameDelta = targetFrameTime;
    }

    // Limitar grandes saltos (ex.: ao voltar de abas/pause)
    const maxFrameDelta = targetFrameTime * 3;
    if (frameDelta > maxFrameDelta) {
        frameDelta = maxFrameDelta;
    }

    // Calcular fator de normalização suavizado para reduzir jitter
    const frameFactor = frameDelta / targetFrameTime;
    const previousFactor = game.deltaTimeFactor || 1;
    const smoothing = 0.15;
    const smoothedFactor = previousFactor + (frameFactor - previousFactor) * smoothing;

    game.deltaTime = targetFrameTime * smoothedFactor;
    game.deltaTimeFactor = smoothedFactor; // Fator de escala (1.0 = 60 FPS)

    // Time Warp: executar updates múltiplos se algum jogador tiver time warp ativo
    let updateCount = 1;
    if ((game.player && game.player.timeWarp) || (game.player2 && game.player2.timeWarp)) {
        updateCount = 2; // 2x velocidade (acelera 100%)
    }

    // Atualizar timers de TimeWarp ANTES do loop (para não decrementar 2x)
    if (game.player && game.player.timeWarpTime > 0) {
        game.player.timeWarpTime -= game.deltaTimeFactor;
        if (game.player.timeWarpTime <= 0) {
            game.player.timeWarp = false;
            game.player.timeWarpMaxTime = 0;
        }
    }
    if (game.player2 && game.player2.timeWarpTime > 0) {
        game.player2.timeWarpTime -= game.deltaTimeFactor;
        if (game.player2.timeWarpTime <= 0) {
            game.player2.timeWarp = false;
            game.player2.timeWarpMaxTime = 0;
        }
    }

    // 🚀 Atualizar novos sistemas (Screen Effects, Particles, etc)
    const shouldContinue = updateNewSystems(game.deltaTimeFactor);
    if (!shouldContinue) {
        // Freeze frame ativo - renderizar mas não atualizar
        return;
    }

    // Update (executar múltiplas vezes se time warp ativo)
    for (let i = 0; i < updateCount; i++) {
        updateChunks();

        // Lógica de transição de bioma baseada no jogador mais avançado
        const playerXForBiome = game.twoPlayerMode && game.player2 ?
            Math.max(game.player.x, game.player2.x) :
            game.player.x;
        const currentChunkIndex = Math.floor(playerXForBiome / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const newBiome = getBiome(currentChunkIndex);

        // Detectar mudança de bioma
        if (game.currentBiome && game.currentBiome.name !== newBiome.name) {
            game.previousBiome = game.currentBiome;
            game.currentBiome = newBiome;
            game.biomeTransition = 0; // Iniciar transição

            // Trocar música do bioma
            const biomeNameMap = {
                'Plains': 'plains',
                'Cave': 'cave',
                'Ice': 'ice',
                'Desert': 'desert',
                'Sky': 'sky',
                'Apocalypse': 'apocalypse',
                'Moon': 'moon',
                'Black Hole': 'black_hole'
            };
            const biomeMusicName = biomeNameMap[newBiome.name] || 'plains';
            game.soundManager?.playBiomeMusic(biomeMusicName);
        } else if (!game.currentBiome) {
            game.currentBiome = newBiome;
            game.previousBiome = null;
            game.biomeTransition = 1; // Sem transição inicial
        }

        // Animar transição (2 segundos de duração)
        if (game.biomeTransition < 1) {
            game.biomeTransition += 0.008; // Incrementar ~60fps -> 2s total
            if (game.biomeTransition >= 1) {
                game.biomeTransition = 1;
                game.previousBiome = null; // Limpar bioma anterior
            }
        }

        // Verificar vitória ao chegar no chunk 69
        const currentChunk = Math.floor(game.player.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        if (currentChunk >= 69 && !game.victoryTriggered) {
            game.victoryTriggered = true;
            console.log('Victory triggered at chunk 69!');
        }

        // Efeito de sucção pelo buraco negro
        if (game.victoryTriggered) {
            game.blackHoleSuctionProgress += 0.008; // ~4 segundos total

            // Atualizar rotação (2 voltas completas durante a sucção)
            game.blackHoleSuctionRotation = game.blackHoleSuctionProgress * Math.PI * 4;

            // Posição do buraco negro (centro-direita da tela)
            const blackHoleX = game.width * 0.65 + game.camera.x;
            const blackHoleY = game.height * 0.4;

            // Aplicar força de sucção ao player
            const applyBlackHoleSuction = (player) => {
                if (!player || player.completelyDead) return;

                const dx = blackHoleX - player.x;
                const dy = blackHoleY - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Força aumenta com o progresso
                const force = game.blackHoleSuctionProgress * 15;

                // Acelerar em direção ao buraco negro
                player.vx += (dx / distance) * force;
                player.vy += (dy / distance) * force;

                // Diminuir tamanho gradualmente
                const shrinkFactor = Math.max(0.2, 1 - game.blackHoleSuctionProgress);
                player.width = CONFIG.PLAYER_WIDTH * shrinkFactor;
                player.height = CONFIG.PLAYER_HEIGHT * shrinkFactor;

                // Remover controle do jogador
                player.controllable = false;
            };

            applyBlackHoleSuction(game.player);
            if (game.twoPlayerMode && game.player2) {
                applyBlackHoleSuction(game.player2);
            }

            // Após 4 segundos, mostrar tela de vitória
            if (game.blackHoleSuctionProgress >= 1) {
                if (window.showVictory) {
                    window.showVictory();
                }
            }
        }

        const chunkPixelWidth = CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
        const horizontalBuffer = chunkPixelWidth;
        const verticalBuffer = CONFIG.TILE_SIZE * 12;
        const updateViewLeft = game.camera.x - horizontalBuffer;
        const updateViewRight = game.camera.x + game.width + horizontalBuffer;
        const updateViewTop = game.camera.y - verticalBuffer;
        const updateViewBottom = game.camera.y + game.height + verticalBuffer;

        game.player.update();
        if (game.twoPlayerMode && game.player2) {
            game.player2.update();
        }
        for (let ci = 0; ci < game.coins.length; ci++) {
            const coin = game.coins[ci];
            if (coin.x + coin.width < updateViewLeft || coin.x > updateViewRight) continue;
            if (coin.y + coin.height < updateViewTop || coin.y > updateViewBottom) continue;
            coin.update();
        }

        for (let ei = 0; ei < game.enemies.length; ei++) {
            const enemy = game.enemies[ei];
            if (enemy.x + enemy.width < updateViewLeft || enemy.x > updateViewRight) continue;
            if (enemy.y + enemy.height < updateViewTop || enemy.y > updateViewBottom) continue;
            enemy.update();
        }

        for (let mi = 0; mi < game.modifiers.length; mi++) {
            const modifier = game.modifiers[mi];
            if (modifier.x + modifier.width < updateViewLeft || modifier.x > updateViewRight) continue;
            if (modifier.y + modifier.height < updateViewTop || modifier.y > updateViewBottom) continue;
            modifier.update();
        }

        if (game.projectiles && game.projectiles.length > 0) {
            for (let pi = 0; pi < game.projectiles.length; pi++) {
                game.projectiles[pi].update();
            }
            game.projectiles = game.projectiles.filter(p => p.alive);
        }

        for (const chunk of game.chunks.values()) {
            const chunkLeft = chunk.x;
            const chunkRight = chunkLeft + chunkPixelWidth;
            if (chunkRight < updateViewLeft || chunkLeft > updateViewRight) continue;

            const hats = chunk.hats;
            for (let hi = 0; hi < hats.length; hi++) {
                const hat = hats[hi];
                if (hat.x + hat.width < updateViewLeft || hat.x > updateViewRight) continue;
                if (hat.y + hat.height < updateViewTop || hat.y > updateViewBottom) continue;
                hat.update();
            }
        }

        if (game.droppingHats && game.droppingHats.length > 0) {
            for (let dhi = 0; dhi < game.droppingHats.length; dhi++) {
                const hat = game.droppingHats[dhi];
                hat.update();
            }
            game.droppingHats = game.droppingHats.filter(hat => !hat.collected);
        }

        for (let pi = 0; pi < game.particles.length; pi++) {
            game.particles[pi].update();
        }

        for (let ti = 0; ti < game.floatingTexts.length; ti++) {
            game.floatingTexts[ti].update();
        }

        // Atualizar partículas ambientes
        initAmbientParticles();
        updateAmbientParticles();
    }

    // Remover partículas e textos mortos
    game.particles = game.particles.filter(p => p.life > 0);
    game.floatingTexts = game.floatingTexts.filter(t => t.life > 0);

    // Atualizar HUD
    if (uiElements) {
        const p1Color = game.player.hatCount === 0 ? '#999' :
                        game.player.hatCount === 1 ? '#f44336' :
                        game.player.hatCount === 2 ? '#FFC107' : '#4CAF50';

        if (uiElements.p1Score) {
            uiElements.p1Score.textContent = game.player.score;
        }
        if (uiElements.p1Hat) {
            uiElements.p1Hat.textContent = game.player.hatCount;
            uiElements.p1Hat.style.color = p1Color;
        }

        if (game.twoPlayerMode && game.player2) {
            const p2Color = game.player2.hatCount === 0 ? '#999' :
                            game.player2.hatCount === 1 ? '#f44336' :
                            game.player2.hatCount === 2 ? '#FFC107' : '#4CAF50';

            if (uiElements.p2Score) {
                uiElements.p2Score.textContent = game.player2.score;
            }
            if (uiElements.p2Hat) {
                uiElements.p2Hat.textContent = game.player2.hatCount;
                uiElements.p2Hat.style.color = p2Color;
            }
        }

        if (uiElements.distance) {
            uiElements.distance.textContent = game.distance;
        }
    }

    updateCamera();

    // Draw
    const ctx = game.ctx;

    // Background
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, game.width, game.height);

    drawBackground(ctx);

    // Parallax animado multi-camadas (após background, antes de partículas)
    drawParallaxLayers(ctx);

    // Partículas ambientes (atrás de tudo, mas na frente do background)
    drawAmbientParticles(ctx);

    // 🚀 Aplicar transformações de câmera (shake, zoom)
    applyCameraTransform(ctx);

    // Chunks (terreno)
    const drawChunkWidth = CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
    const drawBufferX = drawChunkWidth;
    const drawBufferY = CONFIG.TILE_SIZE * 12;
    const drawViewLeft = game.camera.x - drawBufferX;
    const drawViewRight = game.camera.x + game.width + drawBufferX;
    const drawViewTop = game.camera.y - drawBufferY;
    const drawViewBottom = game.camera.y + game.height + drawBufferY;

    const visibleChunks = [];
    for (const chunk of game.chunks.values()) {
        const chunkLeft = chunk.x;
        const chunkRight = chunkLeft + drawChunkWidth;
        if (chunkRight < drawViewLeft || chunkLeft > drawViewRight) continue;
        visibleChunks.push(chunk);
        chunk.draw(ctx);
    }

    for (let ci = 0; ci < game.coins.length; ci++) {
        const coin = game.coins[ci];
        if (coin.collected) continue;
        if (coin.x + coin.width < drawViewLeft || coin.x > drawViewRight) continue;
        if (coin.y + coin.height < drawViewTop || coin.y > drawViewBottom) continue;
        coin.draw(ctx);
    }

    for (let ei = 0; ei < game.enemies.length; ei++) {
        const enemy = game.enemies[ei];
        if (!enemy.alive) continue;
        if (enemy.x + enemy.width < drawViewLeft || enemy.x > drawViewRight) continue;
        if (enemy.y + enemy.height < drawViewTop || enemy.y > drawViewBottom) continue;
        enemy.draw(ctx);
    }

    for (let mi = 0; mi < game.modifiers.length; mi++) {
        const modifier = game.modifiers[mi];
        if (modifier.collected) continue;
        if (modifier.x + modifier.width < drawViewLeft || modifier.x > drawViewRight) continue;
        if (modifier.y + modifier.height < drawViewTop || modifier.y > drawViewBottom) continue;
        modifier.draw(ctx);
    }

    if (game.projectiles && game.projectiles.length > 0) {
        for (let pi = 0; pi < game.projectiles.length; pi++) {
            const projectile = game.projectiles[pi];
            if (projectile.x + projectile.width < drawViewLeft || projectile.x > drawViewRight) continue;
            if (projectile.y + projectile.height < drawViewTop || projectile.y > drawViewBottom) continue;
            projectile.draw(ctx);
        }
    }

    for (let cIndex = 0; cIndex < visibleChunks.length; cIndex++) {
        const chunk = visibleChunks[cIndex];
        const hats = chunk.hats;
        for (let hi = 0; hi < hats.length; hi++) {
            const hat = hats[hi];
            if (hat.collected) continue;
            if (hat.x + hat.width < drawViewLeft || hat.x > drawViewRight) continue;
            if (hat.y + hat.height < drawViewTop || hat.y > drawViewBottom) continue;
            hat.draw(ctx);
        }
    }

    if (game.droppingHats && game.droppingHats.length > 0) {
        for (let dhi = 0; dhi < game.droppingHats.length; dhi++) {
            const hat = game.droppingHats[dhi];
            if (hat.x + hat.width < drawViewLeft || hat.x > drawViewRight) continue;
            if (hat.y + hat.height < drawViewTop || hat.y > drawViewBottom) continue;
            hat.draw(ctx);
        }
    }

    for (let pi = 0; pi < game.particles.length; pi++) {
        const particle = game.particles[pi];
        const particleSize = particle.size || 0;
        if (particle.x + particleSize < drawViewLeft || particle.x > drawViewRight) continue;
        if (particle.y + particleSize < drawViewTop || particle.y > drawViewBottom) continue;
        particle.draw(ctx);
    }

    // Players
    game.player.draw(ctx);
    if (game.twoPlayerMode && game.player2) {
        game.player2.draw(ctx);
    }

    // Floating texts (por cima de tudo)
    for (let ti = 0; ti < game.floatingTexts.length; ti++) {
        const text = game.floatingTexts[ti];
        text.draw(ctx);
    }

    // 🚀 Restaurar transformações de câmera
    restoreCameraTransform(ctx);

    // 🚀 Renderizar novos sistemas (Partículas, Screen Effects)
    renderNewSystems(ctx);

    // Timers de modificadores (centralizados no topo)
    drawModifierTimers(ctx);

    // Bolha mostrando jogador fora da tela (modo 2 jogadores)
    drawOffscreenBubble(ctx);

    // Dev Mode UI (por cima de absolutamente tudo)
    drawDevModeUI(ctx);

    // 🚀 Debug stats dos novos sistemas (se dev mode ativo)
    renderDebugStats(ctx);
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
window.addEventListener('load', async () => {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Inicializar sistema de som
    game.soundManager = soundManager;

    // 🚀 INICIALIZAR NOVOS SISTEMAS (Animation, Particles, Screen Effects, Pooling)
    initializeNewSystems();

    // Configurar canvas responsivo
    resizeCanvas();

    // Configurar handlers
    setupMenuHandlers();
    setupInputHandlers();
    setupContinueModal();

    // IMPORTANTE: Manter loading screen visível enquanto SDK carrega
    const loadingScreen = document.getElementById('loadingScreen');
    const menu = document.getElementById('menu');

    uiElements = {
        p1Score: document.getElementById('p1-score'),
        p1Hat: document.getElementById('p1-hat'),
        p2Score: document.getElementById('p2-score'),
        p2Hat: document.getElementById('p2-hat'),
        distance: document.getElementById('distance')
    };

    // Inicializar SDK de anúncios ANTES de mostrar o menu
    try {
        await rewardedAdsManager.init();
    } catch (error) {
        console.error('Failed to initialize ad SDK:', error);
        // Continuar mesmo se ads falharem (modo fallback sem ads)
    } finally {
        // SEMPRE esconder loading e mostrar menu (mesmo se SDK falhar)
        loadingScreen.classList.add('hidden');
        menu.classList.remove('hidden');

        // Iniciar música de menu
        game.soundManager.playMenuMusic();
    }

    // Começar o loop (mesmo no menu, para possíveis animações)
    requestAnimationFrame(gameLoop);
});

// Redimensionar quando a janela mudar de tamanho
window.addEventListener('resize', resizeCanvas);
