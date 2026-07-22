// ============================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================
export const CONFIG = {
    GRAVITY: 0.6,
    JUMP_STRENGTH: -13,
    MOVE_SPEED: 5,
    FRICTION: 0.85,
    // Corpo físico do sprite novo (a arte completa mede ~70 × 78 px).
    // Braços e chapéu ficam fora da hitbox física para manter colisões justas.
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 56,
    PLAYER_RENDER_HEIGHT: 78,
    PLAYER_RUN_CYCLE_DISTANCE: 80,
    PLAYER_PICKUP_PADDING_X: 12,
    PLAYER_PICKUP_PADDING_TOP: 20,
    TILE_SIZE: 32,
    CHUNK_WIDTH: 30, // tiles por chunk
    VIEW_DISTANCE: 3, // chunks à frente/atrás
    COIN_SIZE: 26,
    MODIFIER_SIZE: 28,
    HAT_WIDTH: 28,
    HAT_HEIGHT: 22,
    COLLECTIBLE_CLEARANCE: 12,
    ENEMY_SIZE: 40,
    STOMP_THRESHOLD: 0.3, // Velocidade mínima para stomp
};
