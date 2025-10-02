import { game } from '../game.js';
import { CONFIG } from '../config.js';

// ============================================
// OFFSCREEN BUBBLE - Mostra jogador fora da câmera
// ============================================

// Estado de visibilidade e zoom por jogador
const bubbleState = {
    player1: {
        wasOffscreen: false,
        zoomMode: 'close' // 'close' ou 'far'
    },
    player2: {
        wasOffscreen: false,
        zoomMode: 'close'
    }
};

// Configurações da bolha
const BUBBLE_CONFIG = {
    radius: 80,
    x: 100,
    y: 100,
    borderWidth: 4,
    zoomClose: 2.5,      // Zoom próximo (área menor, jogador grande)
    zoomFar: 0.03        // Zoom EXTREMAMENTE distante (área gigante, jogador quase invisível)
};

/**
 * Verifica se um jogador está fora da tela
 */
function isPlayerOffscreen(player) {
    if (!player || player.lives <= 0 || player.completelyDead) return false;

    const screenX = player.x - game.camera.x;
    const playerRight = screenX + player.width;

    // Jogador está fora se estiver completamente à esquerda da tela
    return playerRight < 0;
}

/**
 * Atualiza o estado de visibilidade e alterna zoom quando necessário
 */
function updateBubbleState(player, playerKey) {
    const isOffscreen = isPlayerOffscreen(player);
    const state = bubbleState[playerKey];

    // Se o jogador acabou de sair da tela (estava visível e agora não está)
    if (isOffscreen && !state.wasOffscreen) {
        // Alternar zoom cada vez que sai da tela
        state.zoomMode = state.zoomMode === 'close' ? 'far' : 'close';
    }

    state.wasOffscreen = isOffscreen;
}

/**
 * Desenha a bolha mostrando o jogador que está fora da tela
 */
export function drawOffscreenBubble(ctx) {
    if (!game.twoPlayerMode) return;

    // Atualizar estados
    updateBubbleState(game.player, 'player1');
    if (game.player2) {
        updateBubbleState(game.player2, 'player2');
    }

    // Determinar qual jogador mostrar (prioridade para player1 se ambos estiverem fora)
    let playerToShow = null;
    let playerState = null;

    if (isPlayerOffscreen(game.player)) {
        playerToShow = game.player;
        playerState = bubbleState.player1;
    } else if (game.player2 && isPlayerOffscreen(game.player2)) {
        playerToShow = game.player2;
        playerState = bubbleState.player2;
    }

    if (!playerToShow || !playerState) return;

    // Salvar contexto
    ctx.save();

    // Posição da bolha
    const bubbleX = BUBBLE_CONFIG.x;
    const bubbleY = BUBBLE_CONFIG.y;
    const radius = BUBBLE_CONFIG.radius;

    // Criar clipping circular
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Background da bolha
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(bubbleX - radius, bubbleY - radius, radius * 2, radius * 2);

    // Calcular zoom e offset
    const zoom = playerState.zoomMode === 'close' ? BUBBLE_CONFIG.zoomClose : BUBBLE_CONFIG.zoomFar;
    const viewWidth = (radius * 2) / zoom;
    const viewHeight = (radius * 2) / zoom;

    // Centralizar câmera no jogador
    const miniCameraX = playerToShow.x + playerToShow.width / 2 - viewWidth / 2;
    const miniCameraY = playerToShow.y + playerToShow.height / 2 - viewHeight / 2;

    // Aplicar transformação
    ctx.translate(bubbleX, bubbleY);
    ctx.scale(zoom, zoom);
    ctx.translate(-miniCameraX - viewWidth / 2, -miniCameraY - viewHeight / 2);

    // Desenhar background simples
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(miniCameraX, miniCameraY, viewWidth, viewHeight);

    // Desenhar chunks visíveis
    const startChunk = Math.floor(miniCameraX / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
    const endChunk = Math.floor((miniCameraX + viewWidth) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE)) + 1;

    for (let i = startChunk; i <= endChunk; i++) {
        const chunk = game.chunks.get(i);
        if (chunk) {
            // Desenhar plataformas do chunk
            chunk.platforms.forEach(platform => {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            });
        }
    }

    // Desenhar o jogador
    ctx.fillStyle = playerToShow.color;
    ctx.fillRect(playerToShow.x, playerToShow.y, playerToShow.width, playerToShow.height);

    // Olhos simplificados
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playerToShow.x + 6, playerToShow.y + 8, 4, 4);
    ctx.fillRect(playerToShow.x + 14, playerToShow.y + 8, 4, 4);

    // Restaurar contexto
    ctx.restore();

    // Desenhar borda da bolha
    ctx.strokeStyle = playerToShow.color;
    ctx.lineWidth = BUBBLE_CONFIG.borderWidth;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Label da bolha
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Totally fair off-screen camera', bubbleX, bubbleY + radius + 15);
}
