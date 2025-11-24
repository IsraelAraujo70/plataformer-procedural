// ============================================
// OBJECT POOL SYSTEM - Reciclagem de objetos para performance
// Evita garbage collection excessivo
// ============================================

/**
 * Pool genérico de objetos
 */
class Pool {
    constructor(factory, reset, initialSize = 50, maxSize = 500) {
        this.factory = factory;     // Função que cria novos objetos
        this.reset = reset;          // Função que reseta objetos para reuso
        this.initialSize = initialSize;
        this.maxSize = maxSize;
        this.available = [];         // Objetos disponíveis
        this.inUse = new Set();      // Objetos em uso

        // Pré-popular o pool
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.factory());
        }
    }

    /**
     * Obtém um objeto do pool
     */
    acquire(...args) {
        let obj;

        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            // Pool esgotado, criar novo objeto
            if (this.inUse.size < this.maxSize) {
                obj = this.factory();
            } else {
                console.warn(`Pool atingiu o limite máximo de ${this.maxSize} objetos`);
                return null;
            }
        }

        // Resetar objeto com novos parâmetros
        this.reset(obj, ...args);
        this.inUse.add(obj);
        return obj;
    }

    /**
     * Devolve um objeto ao pool
     */
    release(obj) {
        if (!this.inUse.has(obj)) {
            console.warn('Tentando liberar objeto que não está em uso');
            return;
        }

        this.inUse.delete(obj);
        this.available.push(obj);
    }

    /**
     * Libera múltiplos objetos de uma vez
     */
    releaseMany(objects) {
        for (const obj of objects) {
            this.release(obj);
        }
    }

    /**
     * Limpa o pool completamente
     */
    clear() {
        this.available.length = 0;
        this.inUse.clear();

        // Recriar pool inicial
        for (let i = 0; i < this.initialSize; i++) {
            this.available.push(this.factory());
        }
    }

    /**
     * Estatísticas do pool
     */
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size,
            utilizationPercent: (this.inUse.size / this.maxSize * 100).toFixed(1)
        };
    }
}

/**
 * Gerenciador global de pools
 */
export class ObjectPoolManager {
    constructor() {
        this.pools = new Map();
    }

    /**
     * Cria um novo pool
     */
    createPool(name, factory, reset, initialSize, maxSize) {
        if (this.pools.has(name)) {
            console.warn(`Pool "${name}" já existe`);
            return this.pools.get(name);
        }

        const pool = new Pool(factory, reset, initialSize, maxSize);
        this.pools.set(name, pool);
        return pool;
    }

    /**
     * Obtém um pool existente
     */
    getPool(name) {
        const pool = this.pools.get(name);
        if (!pool) {
            console.warn(`Pool "${name}" não encontrado`);
        }
        return pool;
    }

    /**
     * Obtém objeto de um pool
     */
    acquire(poolName, ...args) {
        const pool = this.getPool(poolName);
        return pool ? pool.acquire(...args) : null;
    }

    /**
     * Devolve objeto a um pool
     */
    release(poolName, obj) {
        const pool = this.getPool(poolName);
        if (pool) {
            pool.release(obj);
        }
    }

    /**
     * Limpa todos os pools
     */
    clearAll() {
        for (const pool of this.pools.values()) {
            pool.clear();
        }
    }

    /**
     * Estatísticas de todos os pools
     */
    getAllStats() {
        const stats = {};
        for (const [name, pool] of this.pools.entries()) {
            stats[name] = pool.getStats();
        }
        return stats;
    }

    /**
     * Remove um pool
     */
    removePool(name) {
        const pool = this.pools.get(name);
        if (pool) {
            pool.clear();
            this.pools.delete(name);
        }
    }
}

// ============================================
// POOLS PRÉ-DEFINIDOS PARA O JOGO
// ============================================

export function setupGamePools(poolManager) {
    // Pool de Partículas
    poolManager.createPool(
        'particles',
        // Factory
        () => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: '#ffffff',
            alpha: 1,
            gravity: 0,
            rotation: 0,
            rotationSpeed: 0,
            type: 'circle',
            alive: true
        }),
        // Reset
        (particle, x, y, vx, vy, life, size, color, options = {}) => {
            particle.x = x;
            particle.y = y;
            particle.vx = vx;
            particle.vy = vy;
            particle.life = life;
            particle.maxLife = life;
            particle.size = size;
            particle.color = color;
            particle.alpha = options.alpha !== undefined ? options.alpha : 1;
            particle.gravity = options.gravity !== undefined ? options.gravity : 0.2;
            particle.rotation = options.rotation || 0;
            particle.rotationSpeed = options.rotationSpeed || 0;
            particle.type = options.type || 'circle';
            particle.alive = true;
        },
        500, // Initial size
        2000 // Max size
    );

    // Pool de Floating Text
    poolManager.createPool(
        'floatingText',
        // Factory
        () => ({
            text: '',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            color: '#ffffff',
            fontSize: 16,
            alpha: 1,
            alive: true
        }),
        // Reset
        (text, str, x, y, color, options = {}) => {
            text.text = str;
            text.x = x;
            text.y = y;
            text.vx = options.vx || 0;
            text.vy = options.vy || -2;
            text.life = options.life || 60;
            text.color = color;
            text.fontSize = options.fontSize || 16;
            text.alpha = 1;
            text.alive = true;
        },
        50, // Initial size
        200 // Max size
    );

    // Pool de Moedas
    poolManager.createPool(
        'coins',
        // Factory
        () => ({
            x: 0,
            y: 0,
            width: 16,
            height: 16,
            collected: false,
            animFrame: 0,
            animCounter: 0
        }),
        // Reset
        (coin, x, y) => {
            coin.x = x;
            coin.y = y;
            coin.collected = false;
            coin.animFrame = 0;
            coin.animCounter = 0;
        },
        100, // Initial size
        500 // Max size
    );

    // Pool de Projectiles (inimigos)
    poolManager.createPool(
        'projectiles',
        // Factory
        () => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            width: 8,
            height: 8,
            damage: 1,
            alive: true,
            lifetime: 0,
            maxLifetime: 180,
            owner: null,
            color: '#ff0000'
        }),
        // Reset
        (proj, x, y, vx, vy, options = {}) => {
            proj.x = x;
            proj.y = y;
            proj.vx = vx;
            proj.vy = vy;
            proj.damage = options.damage || 1;
            proj.alive = true;
            proj.lifetime = 0;
            proj.maxLifetime = options.maxLifetime || 180;
            proj.owner = options.owner || null;
            proj.color = options.color || '#ff0000';
        },
        50, // Initial size
        200 // Max size
    );

    // Pool de Trail Effects (rastros de movimento)
    poolManager.createPool(
        'trails',
        // Factory
        () => ({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            alpha: 1,
            life: 0,
            maxLife: 0,
            color: '#ffffff'
        }),
        // Reset
        (trail, x, y, width, height, color, life) => {
            trail.x = x;
            trail.y = y;
            trail.width = width;
            trail.height = height;
            trail.alpha = 1;
            trail.life = life;
            trail.maxLife = life;
            trail.color = color;
        },
        200, // Initial size
        1000 // Max size
    );

    // Pool de Efeitos de Impacto
    poolManager.createPool(
        'impacts',
        // Factory
        () => ({
            x: 0,
            y: 0,
            radius: 0,
            maxRadius: 0,
            life: 0,
            maxLife: 0,
            color: '#ffffff',
            alpha: 1
        }),
        // Reset
        (impact, x, y, maxRadius, life, color) => {
            impact.x = x;
            impact.y = y;
            impact.radius = 0;
            impact.maxRadius = maxRadius;
            impact.life = life;
            impact.maxLife = life;
            impact.color = color;
            impact.alpha = 1;
        },
        50, // Initial size
        200 // Max size
    );

    // Pool de Sound Instances (para spatial audio)
    poolManager.createPool(
        'sounds',
        // Factory
        () => ({
            sound: null,
            x: 0,
            y: 0,
            playing: false,
            volume: 1,
            pan: 0
        }),
        // Reset
        (soundInst, sound, x, y, volume) => {
            soundInst.sound = sound;
            soundInst.x = x;
            soundInst.y = y;
            soundInst.playing = true;
            soundInst.volume = volume;
            soundInst.pan = 0;
        },
        20, // Initial size
        100 // Max size
    );

    // Pool de Animation States (para evitar criar objetos de estado)
    poolManager.createPool(
        'animStates',
        // Factory
        () => ({
            name: '',
            frame: 0,
            timer: 0,
            loop: true,
            completed: false
        }),
        // Reset
        (state, name, loop) => {
            state.name = name;
            state.frame = 0;
            state.timer = 0;
            state.loop = loop !== false;
            state.completed = false;
        },
        30, // Initial size
        100 // Max size
    );
}

// Instância global do gerenciador de pools
export const poolManager = new ObjectPoolManager();

// Inicializar pools do jogo automaticamente
setupGamePools(poolManager);

// ============================================
// HELPERS - Funções auxiliares
// ============================================

/**
 * Cria partículas usando o pool
 */
export function createPooledParticles(x, y, count, options = {}) {
    const particles = [];

    for (let i = 0; i < count; i++) {
        const angle = options.angle !== undefined ?
            options.angle :
            (Math.random() * Math.PI * 2);

        const speed = options.speed !== undefined ?
            options.speed :
            (Math.random() * 3 + 1);

        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const life = options.life || (Math.random() * 30 + 30);
        const size = options.size || (Math.random() * 3 + 2);
        const color = options.color || '#ffffff';

        const particle = poolManager.acquire(
            'particles',
            x, y, vx, vy, life, size, color, options
        );

        if (particle) {
            particles.push(particle);
        }
    }

    return particles;
}

/**
 * Libera partículas de volta ao pool
 */
export function releasePooledParticles(particles) {
    const deadParticles = particles.filter(p => p.life <= 0 || !p.alive);
    for (const particle of deadParticles) {
        poolManager.release('particles', particle);
    }
    return particles.filter(p => p.life > 0 && p.alive);
}

/**
 * Cria texto flutuante usando o pool
 */
export function createPooledFloatingText(text, x, y, color, options = {}) {
    return poolManager.acquire('floatingText', text, x, y, color, options);
}

/**
 * Debug: Mostra estatísticas de todos os pools
 */
export function logPoolStats() {
    const stats = poolManager.getAllStats();
    console.table(stats);
}
