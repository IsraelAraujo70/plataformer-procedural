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
import { getBiomeContext } from './world/Patterns.js';
import { rewardedAdsManager } from './ads/RewardedAds.js';
import { setupContinueModal, resetContinueFlag } from './ui/ContinueModal.js';
import { soundManager } from './audio/SoundManager.js';

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

    // Delta time - normalizado para 60 FPS
    const rawDeltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    // Calcular fator de normalização (16.67ms = 60 FPS)
    const targetFrameTime = 1000 / 60; // ~16.67ms
    game.deltaTime = rawDeltaTime;
    game.deltaTimeFactor = rawDeltaTime / targetFrameTime; // Fator de escala (1.0 = 60 FPS)

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

    // Update (executar múltiplas vezes se time warp ativo)
    for (let i = 0; i < updateCount; i++) {
        updateChunks();

        // Lógica de transição de bioma baseada no jogador mais avançado
        const playerXForBiome = game.twoPlayerMode && game.player2 ?
            Math.max(game.player.x, game.player2.x) :
            game.player.x;
        const chunkWidthPx = CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
        const currentChunkIndex = Math.floor(playerXForBiome / chunkWidthPx);
        const biomeContext = getBiomeContext(currentChunkIndex);
        const newBiome = biomeContext.biome;

        game.biomeTransitionStage = biomeContext.stage;
        game.upcomingBiome = biomeContext.nextBiome;

        const chunkStartX = currentChunkIndex * chunkWidthPx;
        const progress = (playerXForBiome - chunkStartX) / chunkWidthPx;
        game.biomeTransitionStageProgress = Math.max(0, Math.min(1, progress));

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

    // Parallax animado multi-camadas (após background, antes de partículas)
    drawParallaxLayers(ctx);

    // Partículas ambientes (atrás de tudo, mas na frente do background)
    drawAmbientParticles(ctx);

    // Chunks (terreno)
    game.chunks.forEach(chunk => chunk.draw(ctx));

    // Entities
    game.coins.forEach(coin => coin.draw(ctx));
    game.enemies.forEach(enemy => enemy.draw(ctx));
    game.modifiers.forEach(modifier => modifier.draw(ctx));

    // Projéteis
    if (game.projectiles) {
        game.projectiles.forEach(projectile => projectile.draw(ctx));
    }

    // Chapéus dos chunks (coletáveis)
    game.chunks.forEach(chunk => {
        chunk.hats.forEach(hat => hat.draw(ctx));
    });

    // Chapéus temporários (dropping)
    if (game.droppingHats) {
        game.droppingHats.forEach(hat => hat.draw(ctx));
    }

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
window.addEventListener('load', async () => {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Inicializar sistema de som
    game.soundManager = soundManager;

    // Configurar canvas responsivo
    resizeCanvas();

    // Configurar handlers
    setupMenuHandlers();
    setupInputHandlers();
    setupContinueModal();

    // IMPORTANTE: Manter loading screen visível enquanto SDK carrega
    const loadingScreen = document.getElementById('loadingScreen');
    const menu = document.getElementById('menu');

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
