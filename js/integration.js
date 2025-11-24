// ============================================
// INTEGRATION - Integração dos novos sistemas ao jogo
// Este arquivo conecta todos os novos sistemas criados
// ============================================

import { animationSystem } from './systems/AnimationSystem.js';
import { screenEffects } from './systems/ScreenEffects.js';
import { poolManager } from './systems/ObjectPool.js';
import { particleSystem, ParticleTypes, explosionEffect, sparkleEffect, dustCloud, landingImpact, coinCollectEffect } from './systems/ParticleSystem.js';
import { playerSpriteGenerator } from './rendering/PlayerSprites.js';
import { game } from './game.js';

/**
 * Inicializa todos os novos sistemas
 */
export function initializeNewSystems() {
    console.log('🚀 Inicializando novos sistemas...');

    // 1. Gerar animações dos players
    playerSpriteGenerator.generatePlayerAnimations(1); // Player 1
    playerSpriteGenerator.generatePlayerAnimations(2); // Player 2

    // 2. Configurar pools
    console.log('✅ Object Pooling configurado');
    console.log('   - Pools disponíveis:', Array.from(poolManager.pools.keys()));

    // 3. Resetar efeitos de tela
    screenEffects.reset();
    console.log('✅ Screen Effects prontos');

    // 4. Limpar sistema de partículas
    particleSystem.clear();
    console.log('✅ Particle System pronto (max: 2000 partículas)');

    // 5. Expor sistemas globalmente para fácil acesso
    window.screenEffects = screenEffects;
    window.particleSystem = particleSystem;
    window.animationSystem = animationSystem;
    window.poolManager = poolManager;

    // Helpers globais de efeitos
    window.explosionEffect = explosionEffect;
    window.sparkleEffect = sparkleEffect;
    window.dustCloud = dustCloud;
    window.landingImpact = landingImpact;
    window.coinCollectEffect = coinCollectEffect;

    console.log('✅ Sistemas integrados com sucesso!');
    console.log('📊 Use window.poolManager.getAllStats() para ver estatísticas');
}

/**
 * Atualiza todos os sistemas (chamar no game loop)
 */
export function updateNewSystems(deltaTimeFactor) {
    // Atualizar efeitos de tela
    screenEffects.update(deltaTimeFactor);

    // Se estiver em freeze frame, não atualizar outros sistemas
    if (screenEffects.isFrozen()) {
        return false; // Indica que deve pular o update do jogo
    }

    // Atualizar partículas
    particleSystem.update(deltaTimeFactor * screenEffects.getSlowMotionFactor());

    return true; // Continue normalmente
}

/**
 * Renderiza todos os sistemas (chamar após renderizar o jogo)
 */
export function renderNewSystems(ctx) {
    // Renderizar partículas (com culling baseado na câmera)
    particleSystem.render(
        ctx,
        game.camera.x,
        game.camera.y,
        game.width,
        game.height
    );

    // Renderizar efeitos de tela (flash, vignette)
    screenEffects.render(ctx, game.width, game.height);
}

/**
 * Aplica transformações de câmera com efeitos
 */
export function applyCameraTransform(ctx) {
    screenEffects.applyTransform(
        ctx,
        game.width / 2,
        game.height / 2
    );
}

/**
 * Restaura transformações de câmera
 */
export function restoreCameraTransform(ctx) {
    screenEffects.restoreTransform(ctx);
}

/**
 * Limpa todos os sistemas (útil ao reiniciar o jogo)
 */
export function cleanupNewSystems() {
    particleSystem.clear();
    poolManager.clearAll();
    screenEffects.reset();
    console.log('🧹 Sistemas limpos');
}

/**
 * Helper: Criar efeito ao coletar moeda
 */
export function onCoinCollected(x, y) {
    coinCollectEffect(x, y);
    screenEffects.flash('#ffeb3b', 3, 0.2);
}

/**
 * Helper: Criar efeito ao matar inimigo
 */
export function onEnemyKilled(x, y, enemyType) {
    const color = getEnemyColor(enemyType);
    explosionEffect(x, y, color);
    screenEffects.hitStop(0.3);
    screenEffects.shake(0.4, 10);
}

/**
 * Helper: Criar efeito de pouso
 */
export function onPlayerLanding(x, y, force) {
    landingImpact(x, y, force);
    if (force > 0.5) {
        screenEffects.landing(force);
    }
}

/**
 * Helper: Criar efeito de dano
 */
export function onPlayerDamage(x, y, severity = 0.5) {
    particleSystem.burst(x, y, 20, {
        speed: 4,
        life: 30,
        size: 3,
        color: '#ff0000',
        type: ParticleTypes.CIRCLE,
        gravity: 0.3,
        fadeOut: true
    });
    screenEffects.damage(severity);
}

/**
 * Helper: Criar efeito de power-up
 */
export function onPowerUpCollected(x, y, type) {
    const colors = {
        speed: '#00ffff',
        jump: '#00ff00',
        shield: '#ffeb3b',
        double_jump: '#ff00ff',
        magnet: '#ff6600'
    };

    const color = colors[type] || '#ffffff';

    sparkleEffect(x, y, 15);
    particleSystem.burst(x, y, 25, {
        speed: 4,
        life: 40,
        size: 4,
        color: color,
        type: ParticleTypes.STAR,
        gravity: -0.1,
        fadeOut: true,
        glow: true
    });

    screenEffects.flash(color, 8, 0.3);
}

/**
 * Helper: Criar rastro de movimento
 */
export function createMovementTrail(x, y, width, height, color) {
    particleSystem.trail(x, y, 0, 0, 5, {
        life: 15,
        size: Math.min(width, height) / 2,
        color: color + '40', // Semi-transparente
        type: ParticleTypes.SQUARE,
        fadeOut: true,
        shrink: true,
        gravity: 0
    });
}

/**
 * Helper: Obter cor de inimigo por tipo
 */
function getEnemyColor(type) {
    const colors = {
        walker: '#ff6b6b',
        flyer: '#4ecdc4',
        jumper: '#95e1d3',
        chaser: '#f38181',
        shooter: '#aa96da'
    };
    return colors[type] || '#999999';
}

/**
 * Debug: Mostrar estatísticas na tela
 */
export function renderDebugStats(ctx) {
    if (!game.devMode || !game.devMode.enabled) return;

    const stats = {
        particles: particleSystem.getStats(),
        pools: poolManager.getAllStats(),
        effects: {
            shake: screenEffects.shakeDuration > 0,
            flash: screenEffects.flashDuration > 0,
            freeze: screenEffects.freezeFrameActive,
            slowMo: screenEffects.slowMotionFactor.toFixed(2)
        }
    };

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 200);

    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';

    let y = 30;
    ctx.fillText(`=== NOVOS SISTEMAS ===`, 20, y);
    y += 20;
    ctx.fillText(`Partículas: ${stats.particles.activeParticles}/${particleSystem.maxParticles}`, 20, y);
    y += 15;
    ctx.fillText(`Emissores: ${stats.particles.emitters}`, 20, y);
    y += 15;
    ctx.fillText(`Criadas: ${stats.particles.particlesCreated}`, 20, y);
    y += 15;
    ctx.fillText(`Recicladas: ${stats.particles.particlesRecycled}`, 20, y);
    y += 20;

    ctx.fillText(`Shake: ${stats.effects.shake ? 'ON' : 'OFF'}`, 20, y);
    y += 15;
    ctx.fillText(`Flash: ${stats.effects.flash ? 'ON' : 'OFF'}`, 20, y);
    y += 15;
    ctx.fillText(`Freeze: ${stats.effects.freeze ? 'ON' : 'OFF'}`, 20, y);
    y += 15;
    ctx.fillText(`Slow-Mo: ${stats.effects.slowMo}x`, 20, y);

    ctx.restore();
}

console.log('✅ Integration module loaded');
