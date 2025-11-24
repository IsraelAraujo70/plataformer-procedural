// ============================================
// ULTRA PARTICLE SYSTEM - Sistema avançado de partículas
// Suporta 500+ partículas simultâneas com physics
// ============================================

import { poolManager } from './ObjectPool.js';

/**
 * Tipos de partículas pré-definidos
 */
export const ParticleTypes = {
    // Básicos
    CIRCLE: 'circle',
    SQUARE: 'square',
    STAR: 'star',
    TRIANGLE: 'triangle',

    // Efeitos
    SPARKLE: 'sparkle',
    GLOW: 'glow',
    SMOKE: 'smoke',
    DUST: 'dust',
    BUBBLE: 'bubble',
    FLAME: 'flame',
    ELECTRIC: 'electric',
    MAGIC: 'magic',

    // Weather
    RAIN: 'rain',
    SNOW: 'snow',
    LEAF: 'leaf',
    EMBER: 'ember',

    // Impact
    DEBRIS: 'debris',
    SPLATTER: 'splatter',
    SHOCKWAVE: 'shockwave',
    BURST: 'burst'
};

/**
 * Sistema de partículas
 */
export class ParticleSystem {
    constructor(maxParticles = 2000) {
        this.particles = [];
        this.maxParticles = maxParticles;
        this.emitters = [];

        // Configurações globais
        this.gravity = 0.2;
        this.windX = 0;
        this.windY = 0;

        // Estatísticas
        this.stats = {
            activeParticles: 0,
            particlesCreated: 0,
            particlesRecycled: 0
        };
    }

    /**
     * Cria uma explosão de partículas
     */
    burst(x, y, count, options = {}) {
        const particles = [];
        const angleStep = (Math.PI * 2) / count;
        const angleOffset = options.angleOffset || 0;

        for (let i = 0; i < count; i++) {
            const angle = angleStep * i + angleOffset;
            const speed = options.speed || (Math.random() * 3 + 2);
            const speedVariation = options.speedVariation || 0.5;
            const actualSpeed = speed + (Math.random() - 0.5) * speedVariation;

            const vx = Math.cos(angle) * actualSpeed;
            const vy = Math.sin(angle) * actualSpeed;

            const particle = this.createParticle(x, y, vx, vy, options);
            if (particle) {
                particles.push(particle);
            }
        }

        return particles;
    }

    /**
     * Cria uma cone de partículas (direcional)
     */
    cone(x, y, angle, spread, count, options = {}) {
        const particles = [];
        const halfSpread = spread / 2;

        for (let i = 0; i < count; i++) {
            const particleAngle = angle + (Math.random() - 0.5) * spread;
            const speed = options.speed || (Math.random() * 4 + 2);

            const vx = Math.cos(particleAngle) * speed;
            const vy = Math.sin(particleAngle) * speed;

            const particle = this.createParticle(x, y, vx, vy, options);
            if (particle) {
                particles.push(particle);
            }
        }

        return particles;
    }

    /**
     * Cria partículas em linha (para trails)
     */
    trail(x, y, vx, vy, count, options = {}) {
        const particles = [];
        const spacing = options.spacing || 5;

        for (let i = 0; i < count; i++) {
            const offsetX = -vx * i * spacing;
            const offsetY = -vy * i * spacing;

            const particle = this.createParticle(
                x + offsetX,
                y + offsetY,
                vx * 0.5,
                vy * 0.5,
                {
                    ...options,
                    life: options.life || (10 - i * 2)
                }
            );

            if (particle) {
                particles.push(particle);
            }
        }

        return particles;
    }

    /**
     * Cria uma partícula individual
     */
    createParticle(x, y, vx, vy, options = {}) {
        if (this.particles.length >= this.maxParticles) {
            // Pool cheio, reciclar partícula mais antiga
            const oldest = this.particles[0];
            this.recycleParticle(oldest, x, y, vx, vy, options);
            this.stats.particlesRecycled++;
            return oldest;
        }

        // Criar nova partícula
        const particle = poolManager.acquire(
            'particles',
            x, y, vx, vy,
            options.life || 60,
            options.size || 3,
            options.color || '#ffffff',
            {
                alpha: options.alpha !== undefined ? options.alpha : 1,
                gravity: options.gravity !== undefined ? options.gravity : this.gravity,
                rotation: options.rotation || 0,
                rotationSpeed: options.rotationSpeed || (Math.random() - 0.5) * 0.2,
                type: options.type || ParticleTypes.CIRCLE,
                fadeOut: options.fadeOut !== false,
                shrink: options.shrink || false,
                grow: options.grow || false,
                bounce: options.bounce || 0,
                friction: options.friction !== undefined ? options.friction : 0.98,
                wind: options.wind !== false,
                glow: options.glow || false,
                trail: options.trail || false,
                wobble: options.wobble || 0,
                wobbleSpeed: options.wobbleSpeed || 0.1
            }
        );

        if (particle) {
            // Campos customizados
            particle.initialAlpha = particle.alpha;
            particle.initialSize = particle.size;
            particle.wobbleOffset = Math.random() * Math.PI * 2;
            particle.glowIntensity = options.glowIntensity || 0.5;

            this.particles.push(particle);
            this.stats.particlesCreated++;
        }

        return particle;
    }

    /**
     * Recicla uma partícula existente
     */
    recycleParticle(particle, x, y, vx, vy, options) {
        particle.x = x;
        particle.y = y;
        particle.vx = vx;
        particle.vy = vy;
        particle.life = options.life || 60;
        particle.maxLife = particle.life;
        particle.size = options.size || 3;
        particle.color = options.color || '#ffffff';
        particle.alpha = options.alpha !== undefined ? options.alpha : 1;
        particle.rotation = options.rotation || 0;
        particle.rotationSpeed = options.rotationSpeed || (Math.random() - 0.5) * 0.2;
        particle.type = options.type || ParticleTypes.CIRCLE;
        particle.alive = true;
        particle.initialAlpha = particle.alpha;
        particle.initialSize = particle.size;
    }

    /**
     * Cria um emissor contínuo de partículas
     */
    createEmitter(x, y, options = {}) {
        const emitter = {
            x, y,
            active: true,
            rate: options.rate || 10,        // Partículas por segundo
            timer: 0,
            lifetime: options.lifetime || 0,  // 0 = infinito
            age: 0,
            particleOptions: options.particle || {},
            velocityFunc: options.velocityFunc || (() => ({
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3
            })),
            updateFunc: options.updateFunc || null
        };

        this.emitters.push(emitter);
        return emitter;
    }

    /**
     * Remove um emissor
     */
    removeEmitter(emitter) {
        const index = this.emitters.indexOf(emitter);
        if (index !== -1) {
            this.emitters.splice(index, 1);
        }
    }

    /**
     * Atualiza todas as partículas e emissores
     */
    update(deltaTime = 1) {
        // Atualizar emissores
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];

            if (!emitter.active) continue;

            // Atualizar posição do emissor se tiver função de update
            if (emitter.updateFunc) {
                emitter.updateFunc(emitter, deltaTime);
            }

            // Criar partículas baseado na taxa
            emitter.timer += deltaTime;
            const particlesThisFrame = emitter.rate / 60; // Assumindo 60 FPS

            if (emitter.timer >= 1 / particlesThisFrame) {
                const vel = emitter.velocityFunc(emitter);
                this.createParticle(
                    emitter.x, emitter.y,
                    vel.vx, vel.vy,
                    emitter.particleOptions
                );
                emitter.timer = 0;
            }

            // Atualizar idade do emissor
            emitter.age += deltaTime / 60;
            if (emitter.lifetime > 0 && emitter.age >= emitter.lifetime) {
                this.emitters.splice(i, 1);
            }
        }

        // Atualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Aplicar física
            p.vy += p.gravity * deltaTime;

            // Aplicar vento
            if (p.wind) {
                p.vx += this.windX * deltaTime * 0.1;
                p.vy += this.windY * deltaTime * 0.1;
            }

            // Aplicar fricção
            if (p.friction) {
                p.vx *= Math.pow(p.friction, deltaTime);
                p.vy *= Math.pow(p.friction, deltaTime);
            }

            // Wobble (oscilação senoidal)
            if (p.wobble) {
                p.x += Math.sin(p.wobbleOffset + p.life * p.wobbleSpeed) * p.wobble * deltaTime;
            }

            // Atualizar posição
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Atualizar rotação
            p.rotation += p.rotationSpeed * deltaTime;

            // Atualizar vida
            p.life -= deltaTime;

            // Fade out
            if (p.fadeOut && p.life < p.maxLife * 0.3) {
                p.alpha = p.initialAlpha * (p.life / (p.maxLife * 0.3));
            }

            // Shrink
            if (p.shrink) {
                p.size = p.initialSize * (p.life / p.maxLife);
            }

            // Grow
            if (p.grow) {
                p.size = p.initialSize * (1 + (1 - p.life / p.maxLife));
            }

            // Remover partículas mortas
            if (p.life <= 0) {
                poolManager.release('particles', p);
                this.particles.splice(i, 1);
            }
        }

        this.stats.activeParticles = this.particles.length;
    }

    /**
     * Renderiza todas as partículas
     */
    render(ctx, cameraX, cameraY, viewportWidth, viewportHeight) {
        // Culling: só renderizar partículas visíveis
        const padding = 50;
        const viewLeft = cameraX - padding;
        const viewRight = cameraX + viewportWidth + padding;
        const viewTop = cameraY - padding;
        const viewBottom = cameraY + viewportHeight + padding;

        for (const p of this.particles) {
            // Viewport culling
            if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) {
                continue;
            }

            const screenX = p.x - cameraX;
            const screenY = p.y - cameraY;

            ctx.save();
            ctx.globalAlpha = p.alpha;

            // Aplicar glow se necessário
            if (p.glow) {
                ctx.shadowBlur = 10 * p.glowIntensity;
                ctx.shadowColor = p.color;
            }

            ctx.translate(screenX, screenY);
            ctx.rotate(p.rotation);

            // Renderizar baseado no tipo
            this.renderParticleType(ctx, p);

            ctx.restore();
        }
    }

    /**
     * Renderiza um tipo específico de partícula
     */
    renderParticleType(ctx, p) {
        const halfSize = p.size / 2;

        switch (p.type) {
            case ParticleTypes.CIRCLE:
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
                ctx.fill();
                break;

            case ParticleTypes.SQUARE:
                ctx.fillStyle = p.color;
                ctx.fillRect(-halfSize, -halfSize, p.size, p.size);
                break;

            case ParticleTypes.STAR:
                this.drawStar(ctx, 0, 0, 5, halfSize, halfSize * 0.5, p.color);
                break;

            case ParticleTypes.TRIANGLE:
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(0, -halfSize);
                ctx.lineTo(halfSize, halfSize);
                ctx.lineTo(-halfSize, halfSize);
                ctx.closePath();
                ctx.fill();
                break;

            case ParticleTypes.SPARKLE:
                this.drawSparkle(ctx, 0, 0, halfSize, p.color);
                break;

            case ParticleTypes.GLOW:
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, p.color + '00'); // Transparent
                ctx.fillStyle = gradient;
                ctx.fillRect(-halfSize, -halfSize, p.size, p.size);
                break;

            case ParticleTypes.SMOKE:
                const smokeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
                smokeGradient.addColorStop(0, p.color);
                smokeGradient.addColorStop(0.5, p.color + '80'); // Semi-transparent
                smokeGradient.addColorStop(1, p.color + '00');
                ctx.fillStyle = smokeGradient;
                ctx.fillRect(-halfSize, -halfSize, p.size, p.size);
                break;

            default:
                // Default: círculo
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
                ctx.fill();
        }
    }

    /**
     * Desenha uma estrela
     */
    drawStar(ctx, x, y, spikes, outerRadius, innerRadius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }

        ctx.closePath();
        ctx.fill();
    }

    /**
     * Desenha um sparkle (brilho de 4 pontas)
     */
    drawSparkle(ctx, x, y, size, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Cruz
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();

        // Diagonais menores
        const diagSize = size * 0.7;
        ctx.beginPath();
        ctx.moveTo(x - diagSize, y - diagSize);
        ctx.lineTo(x + diagSize, y + diagSize);
        ctx.moveTo(x + diagSize, y - diagSize);
        ctx.lineTo(x - diagSize, y + diagSize);
        ctx.stroke();
    }

    /**
     * Limpa todas as partículas
     */
    clear() {
        for (const particle of this.particles) {
            poolManager.release('particles', particle);
        }
        this.particles.length = 0;
        this.emitters.length = 0;
    }

    /**
     * Retorna estatísticas
     */
    getStats() {
        return {
            ...this.stats,
            emitters: this.emitters.length
        };
    }

    /**
     * Seta vento global
     */
    setWind(x, y) {
        this.windX = x;
        this.windY = y;
    }
}

// Instância global do sistema de partículas
export const particleSystem = new ParticleSystem(2000);

// ============================================
// PRESETS - Efeitos pré-configurados
// ============================================

/**
 * Explosão colorida
 */
export function explosionEffect(x, y, color = '#ff6600') {
    particleSystem.burst(x, y, 30, {
        speed: 5,
        speedVariation: 2,
        life: 40,
        size: 4,
        color: color,
        type: ParticleTypes.CIRCLE,
        gravity: 0.3,
        fadeOut: true,
        shrink: true
    });
}

/**
 * Sparkles mágicos
 */
export function sparkleEffect(x, y, count = 10) {
    particleSystem.burst(x, y, count, {
        speed: 2,
        life: 30,
        size: 3,
        color: '#ffd700',
        type: ParticleTypes.SPARKLE,
        gravity: -0.1, // Flutuam para cima
        fadeOut: true,
        glow: true
    });
}

/**
 * Dust cloud (nuvem de poeira)
 */
export function dustCloud(x, y) {
    particleSystem.burst(x, y, 8, {
        speed: 1.5,
        life: 40,
        size: 6,
        color: '#cccccc80', // Semi-transparente
        type: ParticleTypes.SMOKE,
        gravity: 0.1,
        fadeOut: true,
        grow: true,
        friction: 0.95
    });
}

/**
 * Landing impact (pouso)
 */
export function landingImpact(x, y, force = 1) {
    const count = Math.floor(5 + force * 10);
    particleSystem.cone(x, y, Math.PI / 2, Math.PI, count, {
        speed: force * 3,
        life: 20,
        size: 3,
        color: '#999999',
        type: ParticleTypes.CIRCLE,
        gravity: 0.4,
        fadeOut: true
    });
}

/**
 * Coin collect (coletar moeda)
 */
export function coinCollectEffect(x, y) {
    sparkleEffect(x, y, 8);
    particleSystem.burst(x, y, 12, {
        speed: 3,
        life: 25,
        size: 2,
        color: '#ffeb3b',
        type: ParticleTypes.CIRCLE,
        gravity: -0.2,
        fadeOut: true,
        glow: true
    });
}