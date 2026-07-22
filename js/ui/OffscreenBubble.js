import { game } from '../game.js';
import { CONFIG } from '../config.js';
import { getCharacterFrameBounds } from '../rendering/CharacterSpriteAssets.js?v=first-sprites-restored';
import {
    drawCoverFloatingPlatform,
    drawCoverGroundPlatform
} from '../rendering/TerrainRenderer.js';

const bubbleState = {
    player1: { wasOffscreen: false, zoomMode: 'close' },
    player2: { wasOffscreen: false, zoomMode: 'close' }
};

const SKY_PALETTES = {
    Plains: ['#70e8ff', '#d8fff0'],
    Cave: ['#211345', '#59348b'],
    Ice: ['#6ed8ff', '#eaffff'],
    Desert: ['#51dbe1', '#ffd66e'],
    Sky: ['#5ccfff', '#f2ffff'],
    Apocalypse: ['#4c1839', '#f05a2a'],
    Moon: ['#11163e', '#5267a2'],
    'Black Hole': ['#08051e', '#5e168e']
};

function isPlayerOffscreen(player) {
    if (!player || player.dying || player.completelyDead) return false;
    const screenX = player.x - game.camera.x;
    return screenX + player.width < 0;
}

function updateBubbleState(player, playerKey) {
    const offscreen = isPlayerOffscreen(player);
    const state = bubbleState[playerKey];

    if (offscreen && !state.wasOffscreen) {
        state.zoomMode = state.zoomMode === 'close' ? 'far' : 'close';
    }

    state.wasOffscreen = offscreen;
}

function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function currentChunkFor(player) {
    const chunkWidth = CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
    return game.chunks.get(Math.floor(player.x / chunkWidth));
}

function drawCharacterAt(ctx, player, centerX, feetY, renderHeight) {
    const frame = player.getCharacterSpriteFrame?.();
    const image = frame?.image || player.characterSprite;
    if (!image || !image.complete || image.naturalWidth === 0) {
        const radius = renderHeight * 0.3;
        const fallback = ctx.createRadialGradient(centerX - radius * 0.35, feetY - renderHeight * 0.66, 2, centerX, feetY - renderHeight * 0.5, radius);
        fallback.addColorStop(0, '#ffffff');
        fallback.addColorStop(0.12, player.color || '#20e0f4');
        fallback.addColorStop(1, player.colorDark || '#087ba5');
        ctx.fillStyle = fallback;
        ctx.strokeStyle = '#10072d';
        ctx.lineWidth = Math.max(2, renderHeight * 0.05);
        ctx.beginPath();
        ctx.ellipse(centerX, feetY - renderHeight * 0.47, radius, renderHeight * 0.43, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        return;
    }

    const frameIndex = player.getCharacterFrameIndex?.() ?? 0;
    const [sourceX, sourceY, sourceWidth, sourceHeight] = frame?.bounds ||
        getCharacterFrameBounds(player.playerNumber, frameIndex);
    const renderWidth = renderHeight * (sourceWidth / sourceHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(centerX, feetY);
    ctx.scale(player.visualFacingScale ?? (player.facingRight ? 1 : -1), 1);
    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -renderWidth / 2,
        -renderHeight,
        renderWidth,
        renderHeight
    );
    ctx.restore();
}

function drawCloseFeed(ctx, player, x, y, width, height) {
    const chunk = currentChunkFor(player);
    const biomeName = chunk?.biome?.name || 'Plains';
    const [skyTop, skyBottom] = SKY_PALETTES[biomeName] || SKY_PALETTES.Plains;
    const sky = ctx.createLinearGradient(0, y, 0, y + height);
    sky.addColorStop(0, skyTop);
    sky.addColorStop(1, skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, width, height);

    const zoom = 0.9;
    const viewWidth = width / zoom;
    const viewHeight = height / zoom;
    const cameraX = player.x + player.width / 2 - viewWidth / 2;
    const cameraY = player.y - 25;
    const chunkWidth = CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
    const firstChunk = Math.floor(cameraX / chunkWidth);
    const lastChunk = Math.floor((cameraX + viewWidth) / chunkWidth) + 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    for (let index = firstChunk; index <= lastChunk; index++) {
        const visibleChunk = game.chunks.get(index);
        if (!visibleChunk) continue;
        const visibleBiome = visibleChunk.biome?.name || biomeName;

        visibleChunk.platforms.forEach(platform => {
            if (platform.x + platform.width < cameraX || platform.x > cameraX + viewWidth) return;
            if (platform.y + platform.height < cameraY || platform.y > cameraY + viewHeight) return;

            if (platform.type === 'floating') {
                drawCoverFloatingPlatform(ctx, platform.x, platform.y, platform.width, platform.height, visibleBiome, index, platform.x);
            } else {
                drawCoverGroundPlatform(ctx, platform.x, platform.y, platform.width, platform.renderHeight ?? platform.height, visibleBiome, index, platform.x);
            }
        });
    }

    ctx.restore();

    const playerScreenX = x + (player.x + player.width / 2 - cameraX) * zoom;
    const playerScreenFeetY = y + (player.y + player.height - cameraY) * zoom;
    drawCharacterAt(
        ctx,
        player,
        playerScreenX,
        playerScreenFeetY,
        CONFIG.PLAYER_RENDER_HEIGHT * zoom
    );

    const glare = ctx.createLinearGradient(x, y, x + width, y + height);
    glare.addColorStop(0, 'rgba(255,255,255,.22)');
    glare.addColorStop(0.22, 'rgba(255,255,255,0)');
    glare.addColorStop(1, 'rgba(255,255,255,.04)');
    ctx.fillStyle = glare;
    ctx.fillRect(x, y, width, height);
}

function drawFarFeed(ctx, player, x, y, width, height) {
    const chunk = currentChunkFor(player);
    const biomeName = chunk?.biome?.name || 'Plains';
    const [skyTop, skyBottom] = SKY_PALETTES[biomeName] || SKY_PALETTES.Plains;
    const sky = ctx.createLinearGradient(0, y, 0, y + height);
    sky.addColorStop(0, skyTop);
    sky.addColorStop(1, skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = 'rgba(255,255,255,.72)';
    for (let i = 0; i < 12; i++) {
        const starX = x + ((i * 47 + Math.floor(player.x / 20)) % Math.max(1, width));
        const starY = y + ((i * 29 + 13) % Math.max(1, height * 0.7));
        ctx.fillRect(starX, starY, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }

    const zoom = 0.04;
    const viewWidth = width / zoom;
    const viewHeight = height / zoom;
    const cameraX = player.x + player.width / 2 - viewWidth / 2;
    const cameraY = player.y + player.height / 2 - viewHeight / 2;
    const chunkWidth = CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
    const firstChunk = Math.floor(cameraX / chunkWidth);
    const lastChunk = Math.floor((cameraX + viewWidth) / chunkWidth) + 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    for (let index = firstChunk; index <= lastChunk; index++) {
        const visibleChunk = game.chunks.get(index);
        if (!visibleChunk) continue;
        const visibleBiome = visibleChunk.biome?.name || biomeName;

        visibleChunk.platforms.forEach(platform => {
            if (platform.x + platform.width < cameraX || platform.x > cameraX + viewWidth) return;
            if (platform.y + platform.height < cameraY || platform.y > cameraY + viewHeight) return;

            if (platform.type === 'floating') {
                drawCoverFloatingPlatform(ctx, platform.x, platform.y, platform.width, platform.height, visibleBiome, index, platform.x);
            } else {
                drawCoverGroundPlatform(ctx, platform.x, platform.y, platform.width, platform.renderHeight ?? platform.height, visibleBiome, index, platform.x);
            }
        });
    }

    const playerCenterX = player.x + player.width / 2;
    const playerFeetY = player.y + player.height;
    ctx.restore();

    const playerScreenX = x + (playerCenterX - cameraX) * zoom;
    const playerScreenFeetY = y + (playerFeetY - cameraY) * zoom;
    drawCharacterAt(ctx, player, playerScreenX, playerScreenFeetY, CONFIG.PLAYER_RENDER_HEIGHT * zoom);
}

function drawEmergencyCamera(ctx, player, state) {
    const viewportWidth = Math.max(1, window.innerWidth || game.width);
    const viewportHeight = Math.max(1, window.innerHeight || game.height);
    const canvasScaleX = viewportWidth / game.width;
    const canvasScaleY = viewportHeight / game.height;
    const compact = viewportWidth <= 760;
    const frameWidth = compact ? 164 : 196;
    const frameHeight = compact ? 124 : 146;
    const frameX = compact ? 10 : 18;
    const preferredY = compact ? viewportHeight * 0.25 : viewportHeight * 0.26;
    const frameY = Math.round(Math.max(compact ? 138 : 118, Math.min(viewportHeight - frameHeight - 62, preferredY)));
    const border = compact ? 7 : 8;
    const headerHeight = compact ? 23 : 26;
    const footerHeight = compact ? 24 : 27;
    const screenX = frameX + border;
    const screenY = frameY + headerHeight;
    const screenWidth = frameWidth - border * 2;
    const screenHeight = frameHeight - headerHeight - footerHeight;
    const accent = player.playerNumber === 1 ? '#20e0f4' : '#ff6574';
    const closeMode = state.zoomMode === 'close';

    ctx.save();
    ctx.scale(1 / canvasScaleX, 1 / canvasScaleY);
    ctx.shadowColor = 'rgba(5,1,28,.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 7;
    ctx.shadowOffsetY = 9;
    roundedRect(ctx, frameX, frameY, frameWidth, frameHeight, 21);
    ctx.fillStyle = '#10072d';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const shell = ctx.createLinearGradient(frameX, frameY, frameX + frameWidth, frameY + frameHeight);
    shell.addColorStop(0, '#8f31e8');
    shell.addColorStop(0.55, '#451079');
    shell.addColorStop(1, '#210849');
    roundedRect(ctx, frameX, frameY, frameWidth, frameHeight, 19);
    ctx.fillStyle = shell;
    ctx.fill();
    ctx.strokeStyle = '#10072d';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    roundedRect(ctx, frameX + 5, frameY + 5, frameWidth - 10, frameHeight - 10, 15);
    ctx.stroke();

    ctx.save();
    roundedRect(ctx, screenX, screenY, screenWidth, screenHeight, 9);
    ctx.clip();
    if (closeMode) {
        drawCloseFeed(ctx, player, screenX, screenY, screenWidth, screenHeight);
    } else {
        drawFarFeed(ctx, player, screenX, screenY, screenWidth, screenHeight);
    }
    ctx.restore();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(frameX + 15, frameY + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f8f2ff';
    ctx.font = `900 ${compact ? 8 : 9}px "Arial Rounded MT Bold", Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P${player.playerNumber} · EMERGENCY FEED`, frameX + 24, frameY + headerHeight / 2 + 1);

    const badgeText = closeMode ? 'UNCOMFORTABLY CLOSE' : "THERE'S THE PIXEL";
    ctx.font = `900 ${compact ? 8 : 9}px "Arial Rounded MT Bold", Arial`;
    const badgeWidth = Math.min(frameWidth - 25, ctx.measureText(badgeText).width + 20);
    const badgeX = frameX + (frameWidth - badgeWidth) / 2;
    const badgeY = frameY + frameHeight - footerHeight + 4;
    roundedRect(ctx, badgeX, badgeY, badgeWidth, footerHeight - 8, 8);
    ctx.fillStyle = closeMode ? '#ffdc38' : '#20e0f4';
    ctx.fill();
    ctx.strokeStyle = '#10072d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#10072d';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, frameX + frameWidth / 2, badgeY + (footerHeight - 8) / 2 + 1);

    ctx.fillStyle = '#ffdc38';
    ctx.strokeStyle = '#10072d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(frameX - 8, frameY + frameHeight * 0.52);
    ctx.lineTo(frameX + 7, frameY + frameHeight * 0.42);
    ctx.lineTo(frameX + 7, frameY + frameHeight * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

export function drawOffscreenBubble(ctx) {
    if (!game.twoPlayerMode) return;

    updateBubbleState(game.player, 'player1');
    if (game.player2) updateBubbleState(game.player2, 'player2');

    let playerToShow = null;
    let playerState = null;

    if (isPlayerOffscreen(game.player)) {
        playerToShow = game.player;
        playerState = bubbleState.player1;
    } else if (game.player2 && isPlayerOffscreen(game.player2)) {
        playerToShow = game.player2;
        playerState = bubbleState.player2;
    }

    if (playerToShow && playerState) {
        drawEmergencyCamera(ctx, playerToShow, playerState);
    }
}
