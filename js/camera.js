import { game } from './game.js';
import { CONFIG } from './config.js';
import { Random } from './utils/Random.js';
import { Chunk } from './world/Chunk.js';

// ============================================
// GERAÇÃO E GESTÃO DE CHUNKS
// ============================================
export function updateChunks() {
    // No modo 2 jogadores, considerar apenas jogadores vivos
    let referenceX = game.player.lives > 0 ? game.player.x : 0;
    if (game.twoPlayerMode && game.player2) {
        if (game.player.lives > 0 && game.player2.lives > 0) {
            referenceX = Math.max(game.player.x, game.player2.x);
        } else if (game.player2.lives > 0) {
            referenceX = game.player2.x;
        }
    }

    const playerChunk = Math.floor(referenceX / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

    // Gerar chunks à frente e atrás (apenas chunks 0+)
    for (let i = Math.max(0, playerChunk - CONFIG.VIEW_DISTANCE); i <= playerChunk + CONFIG.VIEW_DISTANCE; i++) {
        if (!game.chunks.has(i)) {
            // Criar seed única para este chunk baseada na seed global
            const chunkRandom = new Random(game.seed + i * 1000);
            const chunk = new Chunk(i, chunkRandom);
            game.chunks.set(i, chunk);

            // Adicionar entidades do chunk às listas globais
            game.coins.push(...chunk.coins);
            game.enemies.push(...chunk.enemies);
            game.modifiers.push(...chunk.modifiers);
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
        game.modifiers = game.modifiers.filter(m => !chunk.modifiers.includes(m));
        game.chunks.delete(index);
    });
}

// ============================================
// CAMERA
// ============================================
export function updateCamera() {
    // Modo 2 jogadores: seguir apenas jogadores vivos
    if (game.twoPlayerMode && game.player2) {
        // Considerar apenas jogadores vivos
        if (game.player.lives > 0 && game.player2.lives > 0) {
            const rightmostX = Math.max(game.player.x, game.player2.x);
            game.camera.targetX = rightmostX - game.width / 3;
        } else if (game.player.lives > 0) {
            game.camera.targetX = game.player.x - game.width / 3;
        } else if (game.player2.lives > 0) {
            game.camera.targetX = game.player2.x - game.width / 3;
        }
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
