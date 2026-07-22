import { CONFIG } from '../config.js';

// ============================================
// PATTERNS - Padrões pré-desenhados de plataformas
// ============================================

const T = CONFIG.TILE_SIZE; // Atalho para facilitar leitura

export const PATTERNS = {
    // Caminho plano seguro (fallback)
    FLAT_SAFE: {
        name: 'Flat Safe',
        width: 15, // tiles
        difficulty: 0,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 5, type: 'ground' },
            { offsetX: 8, offsetY: 0, width: 5, type: 'ground' }
        ]
    },

    // Escada ascendente
    STAIRCASE_UP: {
        name: 'Staircase Up',
        width: 18,
        difficulty: 1,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 4, type: 'ground' },
            { offsetX: 5, offsetY: -2, width: 4, type: 'ground' },
            { offsetX: 10, offsetY: -4, width: 4, type: 'ground' },
            { offsetX: 15, offsetY: -6, width: 4, type: 'ground' }
        ]
    },

    // Escada descendente
    STAIRCASE_DOWN: {
        name: 'Staircase Down',
        width: 18,
        difficulty: 1,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 4, type: 'ground' },
            { offsetX: 5, offsetY: 2, width: 4, type: 'ground' },
            { offsetX: 10, offsetY: 4, width: 4, type: 'ground' },
            { offsetX: 15, offsetY: 6, width: 4, type: 'ground' }
        ]
    },

    // Ponte de plataformas flutuantes
    FLOATING_BRIDGE: {
        name: 'Floating Bridge',
        width: 20,
        difficulty: 2,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 6, offsetY: -1, width: 2, type: 'floating' },
            { offsetX: 10, offsetY: -2, width: 2, type: 'floating' },
            { offsetX: 14, offsetY: -1, width: 2, type: 'floating' },
            { offsetX: 18, offsetY: 0, width: 3, type: 'ground' }
        ]
    },

    // Gap largo com plataforma central
    GAP_CHALLENGE: {
        name: 'Gap Challenge',
        width: 16,
        difficulty: 2,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 7, offsetY: -2, width: 2, type: 'floating' },
            { offsetX: 13, offsetY: 0, width: 3, type: 'ground' }
        ]
    },

    // Torre vertical com recompensa no topo
    VERTICAL_TOWER: {
        name: 'Vertical Tower',
        width: 12,
        difficulty: 3,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 6, type: 'ground' },
            { offsetX: 1, offsetY: -3, width: 2, type: 'floating' },
            { offsetX: 3, offsetY: -6, width: 2, type: 'floating' },
            { offsetX: 1, offsetY: -9, width: 4, type: 'floating' }
        ],
        reward: 'modifier', // Modificador no topo
        rewardPlatform: 3 // Índice da plataforma do topo
    },

    // Ziguezague
    ZIGZAG: {
        name: 'Zigzag',
        width: 20,
        difficulty: 2,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 5, offsetY: -2, width: 3, type: 'floating' },
            { offsetX: 10, offsetY: 0, width: 3, type: 'floating' },
            { offsetX: 15, offsetY: -2, width: 3, type: 'floating' },
            { offsetX: 18, offsetY: 0, width: 4, type: 'ground' }
        ]
    },

    // Subida íngreme (desafio)
    STEEP_CLIMB: {
        name: 'Steep Climb',
        width: 14,
        difficulty: 3,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 4, type: 'ground' },
            { offsetX: 4, offsetY: -3, width: 2, type: 'floating' },
            { offsetX: 7, offsetY: -6, width: 2, type: 'floating' },
            { offsetX: 10, offsetY: -9, width: 4, type: 'ground' }
        ]
    },

    // Caminho baixo (passa por baixo)
    UNDERPASS: {
        name: 'Underpass',
        width: 16,
        difficulty: 1,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 3, offsetY: 3, width: 10, type: 'ground' }, // Plataforma baixa
            { offsetX: 13, offsetY: 0, width: 3, type: 'ground' }
        ]
    },

    // Plataformas pequenas em sequência
    STEPPING_STONES: {
        name: 'Stepping Stones',
        width: 18,
        difficulty: 2,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 4, offsetY: -1, width: 2, type: 'floating' },
            { offsetX: 7, offsetY: -2, width: 2, type: 'floating' },
            { offsetX: 10, offsetY: -1, width: 2, type: 'floating' },
            { offsetX: 13, offsetY: 0, width: 2, type: 'floating' },
            { offsetX: 16, offsetY: 0, width: 3, type: 'ground' }
        ]
    },

    // U invertido (descer e subir)
    VALLEY: {
        name: 'Valley',
        width: 16,
        difficulty: 2,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 4, offsetY: 3, width: 3, type: 'ground' },
            { offsetX: 8, offsetY: 5, width: 3, type: 'ground' },
            { offsetX: 12, offsetY: 3, width: 3, type: 'ground' },
            { offsetX: 15, offsetY: 0, width: 3, type: 'ground' }
        ]
    },

    // Montanha (subida e descida)
    MOUNTAIN: {
        name: 'Mountain',
        width: 18,
        difficulty: 2,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 3, type: 'ground' },
            { offsetX: 4, offsetY: -2, width: 3, type: 'ground' },
            { offsetX: 8, offsetY: -4, width: 4, type: 'ground' },
            { offsetX: 13, offsetY: -2, width: 3, type: 'ground' },
            { offsetX: 17, offsetY: 0, width: 3, type: 'ground' }
        ]
    },

    // Pulo longo com plataforma estreita
    LONG_GAP: {
        name: 'Long Gap',
        width: 14,
        difficulty: 3,
        platforms: [
            { offsetX: 0, offsetY: 0, width: 4, type: 'ground' },
            { offsetX: 11, offsetY: 0, width: 4, type: 'ground' }
        ]
    }
};

// Tipos de plataforma especiais (para implementar depois)
export const PLATFORM_TYPES = {
    ground: {
        solid: true,
        friction: CONFIG.FRICTION,
        hitboxHeight: T * 3,
        renderHeight: T * 3
    },

    floating: {
        solid: true,
        friction: CONFIG.FRICTION,
        hitboxHeight: Math.round(T * 1.5),
        renderHeight: T
    },

    moving: {
        solid: true,
        friction: CONFIG.FRICTION,
        hitboxHeight: Math.round(T * 1.5),
        renderHeight: T,
        movement: {
            direction: 'horizontal', // ou 'vertical'
            range: 100,
            speed: 2
        }
    },

    crumbling: {
        solid: true,
        friction: CONFIG.FRICTION,
        hitboxHeight: T * 3,
        renderHeight: T * 3,
        lifetime: 120, // frames antes de cair
        respawnTime: 300
    },

    ice: {
        solid: true,
        friction: 0.98, // Super escorregadio
        hitboxHeight: T * 3,
        renderHeight: T * 3
    },

    bouncy: {
        solid: true,
        friction: CONFIG.FRICTION,
        bounceForce: 1.5, // Multiplica força do pulo
        hitboxHeight: Math.round(T * 1.5),
        renderHeight: T
    }
};

// Configuração de dificuldade multi-dimensional
export function getDifficultyConfig(chunkIndex) {
    const distance = chunkIndex;

    return {
        // Progressão de tamanho de plataforma
        minPlatformSize: Math.max(CONFIG.PLAYER_WIDTH * 1.5, CONFIG.TILE_SIZE * 3 - (CONFIG.TILE_SIZE * 1.5 * Math.min(distance / 30, 1))),
        maxPlatformSize: CONFIG.TILE_SIZE * 8 - (CONFIG.TILE_SIZE * 6 * Math.min(distance / 40, 1)),

        // Progressão de gaps (aumentados para evitar amontoamento)
        minGap: CONFIG.TILE_SIZE * (3 + Math.min(distance * 0.05, 2)),
        maxGap: CONFIG.TILE_SIZE * (6 + Math.min(distance * 0.08, 4)),

        // Variação de altura (mais dramática)
        heightVariation: CONFIG.TILE_SIZE * (2 + Math.min(distance * 0.05, 3)),

        // Densidade de inimigos
        enemyChance: Math.min(0.3 + distance * 0.02, 0.75),

        // Densidade de moedas (inverso da dificuldade)
        coinChance: Math.max(0.7 - distance * 0.01, 0.3),

        // Modificadores são pontuação do percurso, não obrigação de todo chunk
        modifierChance: Math.min(0.22 + distance * 0.005, 0.4),

        // Chance de usar patterns ao invés de geração simples (começar alto)
        patternChance: Math.min(0.5 + distance * 0.01, 0.8),

        // Tipos de plataforma permitidos (desbloqueio gradual)
        allowMoving: distance > 10,
        allowCrumbling: distance > 20,
        allowIce: distance > 15,
        allowBouncy: distance > 8,

        // Plataformas flutuantes
        floatingChance: Math.min(0.4 + distance * 0.01, 0.7),
        floatingCount: Math.min(1 + Math.floor(distance / 10), 4)
    };
}

// Seleciona pattern baseado em dificuldade
export function selectPattern(rng, difficulty) {
    const availablePatterns = Object.entries(PATTERNS).filter(([key, pattern]) => {
        return pattern.difficulty <= difficulty;
    });

    if (availablePatterns.length === 0) {
        return PATTERNS.FLAT_SAFE;
    }

    const [key, pattern] = availablePatterns[rng.int(0, availablePatterns.length - 1)];
    return pattern;
}

// Biomas (temas visuais e mecânicos)
export const BIOMES = {
    PLAINS: {
        name: 'Plains',
        backgroundType: 'plains',
        colors: {
            grass: '#47db24',
            grassDark: '#087b35',
            ground: '#8f3e20',
            groundDark: '#32172b'
        },
        allowedTypes: ['ground', 'floating', 'bouncy'],
        decorations: ['flower', 'rock', 'bush']
    },

    CAVE: {
        name: 'Cave',
        backgroundType: 'cave',
        colors: {
            ground: '#33466e',
            groundDark: '#16172f',
            accent: '#a66cff'
        },
        allowedTypes: ['ground', 'floating', 'crumbling'],
        decorations: ['stalactite', 'crystal', 'mushroom'],
        darkAmbient: true
    },

    ICE: {
        name: 'Ice',
        backgroundType: 'ice',
        colors: {
            ground: '#2879ae',
            groundDark: '#15345f',
            ice: '#d9ffff',
            accent: '#66d9ed'
        },
        allowedTypes: ['ice', 'ground', 'floating'],
        decorations: ['snowflake', 'icicle', 'snowpile'],
        enemySpeedMultiplier: 0.6 // Inimigos mais lentos no gelo
    },

    DESERT: {
        name: 'Desert',
        backgroundType: 'desert',
        colors: {
            sand: '#ffc83e',
            sandDark: '#e46721',
            ground: '#b94c21',
            groundDark: '#54203b'
        },
        allowedTypes: ['ground', 'floating'],
        decorations: ['cactus', 'skull', 'tumbleweed'],
        enemySpeedMultiplier: 0.85 // Inimigos um pouco mais lentos no calor
    },

    SKY: {
        name: 'Sky',
        backgroundType: 'sky',
        colors: {
            cloud: '#efffb5',
            cloudDark: '#46a88e',
            accent: '#7ce8ff',
            grass: '#b7f48e', // Grama celestial
            grassDark: '#46a88e'
        },
        allowedTypes: ['floating', 'bouncy', 'moving'],
        decorations: ['cloud', 'bird', 'star', 'light_ray', 'balloon', 'kite', 'celestial_crystal'],
        heightBias: -2 // Tende para cima
    },

    APOCALYPSE: {
        name: 'Apocalypse',
        backgroundType: 'apocalypse',
        colors: {
            ground: '#5c2730',
            groundDark: '#1d1122',
            accent: '#ffcf35'
        },
        allowedTypes: ['ground', 'crumbling', 'floating'],
        decorations: ['rubble', 'fire', 'crack'],
        darkAmbient: true,
        enemySpeedMultiplier: 1.2 // Inimigos mais rápidos (caos)
    },

    MOON: {
        name: 'Moon',
        backgroundType: 'moon',
        colors: {
            ground: '#676c86',
            groundDark: '#28283f',
            accent: '#79ddff'
        },
        allowedTypes: ['ground', 'floating'],
        decorations: ['crater', 'rock', 'flag'],
        enemySpeedMultiplier: 0.7 // Inimigos mais lentos (baixa gravidade)
    },

    BLACK_HOLE: {
        name: 'Black Hole',
        backgroundType: 'black_hole',
        colors: {
            ground: '#3b205c',
            groundDark: '#110b27',
            accent: '#ff7651'
        },
        allowedTypes: ['floating', 'crumbling'],
        decorations: ['void', 'energy', 'distortion'],
        darkAmbient: true,
        enemySpeedMultiplier: 1.5, // Inimigos muito rápidos (gravidade intensa)
        finalBiome: true // Última fase
    }
};

// Retorna bioma baseado no chunk index
export function getBiome(chunkIndex) {
    // Trocar bioma a cada 8 chunks
    const biomeLength = 8;
    const biomeIndex = Math.floor(chunkIndex / biomeLength);
    const biomes = Object.keys(BIOMES);

    // Se chegou no buraco negro (última fase), manter nele
    const maxBiomeIndex = biomes.length - 1;
    const currentBiomeIndex = Math.min(biomeIndex, maxBiomeIndex);

    return BIOMES[biomes[currentBiomeIndex]];
}
