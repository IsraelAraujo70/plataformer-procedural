import { game } from './game.js';
import { CONFIG } from './config.js';
import { Random } from './utils/Random.js';
import { Chunk } from './world/Chunk.js';

// ============================================
// GERAÇÃO E GESTÃO DE CHUNKS
// ============================================
export function updateChunks() {
    // No modo 2 jogadores, considerar apenas jogadores vivos
    let referenceX = !game.player.dying && !game.player.completelyDead ? game.player.x : 0;
    if (game.twoPlayerMode && game.player2) {
        const p1Alive = !game.player.dying && !game.player.completelyDead;
        const p2Alive = !game.player2.dying && !game.player2.completelyDead;

        if (p1Alive && p2Alive) {
            referenceX = Math.max(game.player.x, game.player2.x);
        } else if (p2Alive) {
            referenceX = game.player2.x;
        }
    }

    const playerChunk = Math.floor(referenceX / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

    const queue = game.chunkGenerationQueue;
    const queueSet = game.chunkGenerationSet;

    // Solicitar novos chunks dentro da janela
    let queueDirty = false;
    const startIndex = Math.max(0, playerChunk - CONFIG.VIEW_DISTANCE);
    const endIndex = playerChunk + CONFIG.VIEW_DISTANCE;

    for (let i = startIndex; i <= endIndex; i++) {
        if (i > 69) break; // Parar geração após o chunk 69
        if (game.chunks.has(i) || queueSet.has(i)) continue;

        queue.push(i);
        queueSet.add(i);
        queueDirty = true;
    }

    if (queueDirty && queue.length > 1) {
        queue.sort((a, b) => a - b);
    }

    // Gerar um número limitado de chunks por frame para evitar travadas
    const maxPerFrame = game.chunks.size === 0 ? queue.length : Math.max(1, game.maxChunksPerFrame || 2);
    let generatedThisFrame = 0;

    while (queue.length > 0 && generatedThisFrame < maxPerFrame) {
        const index = queue.shift();
        queueSet.delete(index);

        if (game.chunks.has(index) || index < 0 || index > 69) {
            continue;
        }

        const chunkRandom = new Random(game.seed + index * 1000);
        const previousChunk = game.chunks.get(index - 1) || null;
        const chunk = new Chunk(index, chunkRandom, previousChunk);
        game.chunks.set(index, chunk);

        game.coins.push(...chunk.coins);
        game.enemies.push(...chunk.enemies);
        game.modifiers.push(...chunk.modifiers);

        generatedThisFrame++;
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
        if (!chunk) return;

        if (queueSet.has(index)) {
            queueSet.delete(index);
            const queuePos = queue.indexOf(index);
            if (queuePos !== -1) {
                queue.splice(queuePos, 1);
            }
        }

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
        const p1Alive = !game.player.dying && !game.player.completelyDead;
        const p2Alive = !game.player2.dying && !game.player2.completelyDead;

        if (p1Alive && p2Alive) {
            const rightmostX = Math.max(game.player.x, game.player2.x);
            game.camera.targetX = rightmostX - game.width / 3;
        } else if (p1Alive) {
            game.camera.targetX = game.player.x - game.width / 3;
        } else if (p2Alive) {
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
