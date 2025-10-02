// ============================================
// GAME STATE
// ============================================
export const game = {
    canvas: null,
    ctx: null,
    width: 1280,
    height: 720,
    state: 'menu', // 'menu', 'playing', 'paused', 'gameover'
    seed: 0,
    random: null,
    keys: {},
    camera: { x: 0, y: 0, targetX: 0 },
    player: null,
    player2: null,
    twoPlayerMode: false,
    chunks: new Map(),
    entities: [],
    coins: [],
    enemies: [],
    powerups: [],
    particles: [],
    floatingTexts: [],
    score: 0,
    lives: 3,
    distance: 0,
    difficulty: 0,
    stats: {
        coinsCollected: 0,
        enemiesDefeated: 0,
        powerupsCollected: 0,
        lastDistance: 0
    },
    lastTime: 0,
    deltaTime: 0,
    devMode: {
        enabled: false,
        noclip: false,
        showHitboxes: false,
        showGrid: false,
        showInfo: true,
        invincible: false,
        flySpeed: 10,
        timeScale: 1.0,
        gravityEnabled: true,
        keySequence: [],
        lastKeyTime: 0
    }
};
