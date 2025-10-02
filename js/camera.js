import { game } from './game.js';
import { CONFIG } from './config.js';
import { Random } from './utils/Random.js';
import { Chunk } from './world/Chunk.js';

// ============================================
// GERAÇÃO E GESTÃO DE CHUNKS
// ============================================
export function updateChunks() {
    // No modo 2 jogadores, considerar o jogador mais à direita
    let referenceX = game.player.x;
    if (game.twoPlayerMode && game.player2 && game.player2.lives > 0) {
        referenceX = Math.max(game.player.x, game.player2.x);
    }

    const playerChunk = Math.floor(referenceX / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

    // Gerar chunks à frente e atrás
    for (let i = playerChunk - CONFIG.VIEW_DISTANCE; i <= playerChunk + CONFIG.VIEW_DISTANCE; i++) {
        if (!game.chunks.has(i)) {
            // Criar seed única para este chunk baseada na seed global
            const chunkRandom = new Random(game.seed + i * 1000);
            const chunk = new Chunk(i, chunkRandom);
            game.chunks.set(i, chunk);

            // Adicionar entidades do chunk às listas globais
            game.coins.push(...chunk.coins);
            game.enemies.push(...chunk.enemies);
            game.powerups.push(...chunk.powerups);
        }
    }

    // Remover chunks muito distantes (culling)
    const chunksToRemove = [];
    game.chunks.forEach((chunk, index) => {
        if (Math.abs(index - playerChunk) > CONFIG.VIEW_DISTANCE + 2) {
            chunksToRemove.push(index);
        }
    });

    chunksToRemove.forEach(index => {
        const chunk = game.chunks.get(index);
        // Remover entidades do chunk
        game.coins = game.coins.filter(c => !chunk.coins.includes(c));
        game.enemies = game.enemies.filter(e => !chunk.enemies.includes(e));
        game.powerups = game.powerups.filter(p => !chunk.powerups.includes(p));
        game.chunks.delete(index);
    });
}

// ============================================
// CAMERA
// ============================================
export function updateCamera() {
    // Modo 2 jogadores: seguir o jogador mais à direita
    if (game.twoPlayerMode && game.player2) {
        const rightmostX = Math.max(game.player.x, game.player2.x);
        game.camera.targetX = rightmostX - game.width / 3;
    } else {
        // Modo 1 jogador: seguir o jogador normalmente
        game.camera.targetX = game.player.x - game.width / 3;
    }

    game.camera.x += (game.camera.targetX - game.camera.x) * 0.1;

    // Limitar câmera para não mostrar área negativa
    if (game.camera.x < 0) game.camera.x = 0;

    // Camera Y fixa
    game.camera.y = 0;
}
