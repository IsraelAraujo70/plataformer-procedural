import { game } from './game.js';
import { CONFIG } from './config.js';
import { Random } from './utils/Random.js';
import { Chunk } from './world/Chunk.js';

// ============================================
// DEV MODE - Funções
// ============================================

export function toggleDevMode() {
    game.devMode.enabled = !game.devMode.enabled;

    if (game.devMode.enabled) {
        console.log('🛠️ DEV MODE ATIVADO');
        // Ativar invencibilidade e noclip por padrão
        game.devMode.invincible = true;
        game.devMode.noclip = true;
        game.devMode.showHitboxes = false;
        game.devMode.showGrid = false;
    } else {
        console.log('DEV MODE DESATIVADO');
        game.devMode.noclip = false;
        game.devMode.invincible = false;
        game.devMode.gravityEnabled = true;
    }
}

export function handleDevModeKeys(key) {
    if (!game.devMode.enabled) return;

    switch(key.toLowerCase()) {
        case 'h': // Toggle Hitboxes
            game.devMode.showHitboxes = !game.devMode.showHitboxes;
            console.log('Hitboxes:', game.devMode.showHitboxes ? 'ON' : 'OFF');
            break;

        case 'g': // Toggle Gravity
            game.devMode.gravityEnabled = !game.devMode.gravityEnabled;
            console.log('Gravidade:', game.devMode.gravityEnabled ? 'ON' : 'OFF');
            break;

        case 'f': // Toggle Noclip/Fly
            game.devMode.noclip = !game.devMode.noclip;
            console.log('Voo/Noclip:', game.devMode.noclip ? 'ON' : 'OFF');
            break;

        case 'i': // Toggle Invincible
            game.devMode.invincible = !game.devMode.invincible;
            console.log('Invencível:', game.devMode.invincible ? 'ON' : 'OFF');
            break;

        case 'm': // Teleport forward
            game.player.x += 500;
            console.log('Teleport +500px');
            break;

        case 'r': // Reset position
            game.player.x = 100;
            game.player.y = 100;
            console.log('Posição resetada');
            break;

        case 'n': // Force generate next chunk
            const nextChunk = Math.floor(game.player.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE)) + 1;
            if (!game.chunks.has(nextChunk)) {
                const chunkRandom = new Random(game.seed + nextChunk * 1000);
                const chunk = new Chunk(nextChunk, chunkRandom);
                game.chunks.set(nextChunk, chunk);
                game.coins.push(...chunk.coins);
                game.enemies.push(...chunk.enemies);
                game.powerups.push(...chunk.powerups);
                console.log('Chunk', nextChunk, 'gerado manualmente');
            }
            break;

        case 'b': // Toggle grid
            game.devMode.showGrid = !game.devMode.showGrid;
            console.log('Grid:', game.devMode.showGrid ? 'ON' : 'OFF');
            break;

        case '=':
        case '+': // Increase speed
            game.devMode.flySpeed = Math.min(30, game.devMode.flySpeed + 2);
            console.log('Velocidade de voo:', game.devMode.flySpeed);
            break;

        case '-':
        case '_': // Decrease speed
            game.devMode.flySpeed = Math.max(2, game.devMode.flySpeed - 2);
            console.log('Velocidade de voo:', game.devMode.flySpeed);
            break;
    }
}

export function drawDevModeUI(ctx) {
    if (!game.devMode.enabled) return;

    // Painel de informações
    if (game.devMode.showInfo) {
        ctx.save();

        // Fundo do painel (aumentado para 330 de altura)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 300, 330);

        // Borda
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 300, 330);

        // Texto
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('🛠️ DEV MODE ATIVO', 20, 35);

        ctx.strokeStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(20, 45);
        ctx.lineTo(290, 45);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        let y = 65;
        const lineHeight = 18;

        ctx.fillText(`Pos: (${Math.floor(game.player.x)}, ${Math.floor(game.player.y)})`, 20, y); y += lineHeight;
        ctx.fillText(`Vel: (${game.player.vx.toFixed(1)}, ${game.player.vy.toFixed(1)})`, 20, y); y += lineHeight;
        ctx.fillText(`Chunk: ${Math.floor(game.player.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE))}`, 20, y); y += lineHeight;
        ctx.fillText(`Chunks Loaded: ${game.chunks.size}`, 20, y); y += lineHeight;
        ctx.fillText(`Enemies: ${game.enemies.filter(e => e.alive).length}/${game.enemies.length}`, 20, y); y += lineHeight;
        ctx.fillText(`Coins: ${game.coins.filter(c => !c.collected).length}/${game.coins.length}`, 20, y); y += lineHeight;
        ctx.fillText(`Powerups: ${game.powerups.filter(p => !p.collected).length}/${game.powerups.length}`, 20, y); y += lineHeight;

        y += 10;
        ctx.strokeStyle = '#555555';
        ctx.beginPath();
        ctx.moveTo(20, y - 5);
        ctx.lineTo(290, y - 5);
        ctx.stroke();

        ctx.fillStyle = game.devMode.noclip ? '#00ff00' : '#ff0000';
        ctx.fillText(`[F] Voo: ${game.devMode.noclip ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.invincible ? '#00ff00' : '#ff0000';
        ctx.fillText(`[I] Invencível: ${game.devMode.invincible ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.gravityEnabled ? '#00ff00' : '#ff0000';
        ctx.fillText(`[G] Gravidade: ${game.devMode.gravityEnabled ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.showHitboxes ? '#00ff00' : '#ff0000';
        ctx.fillText(`[H] Hitboxes: ${game.devMode.showHitboxes ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.showGrid ? '#00ff00' : '#ff0000';
        ctx.fillText(`[B] Grid: ${game.devMode.showGrid ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        y += 10;
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`[M] Teleport  [R] Reset`, 20, y); y += lineHeight;
        ctx.fillText(`[+/-] Speed (${game.devMode.flySpeed})`, 20, y); y += lineHeight;
        ctx.fillText(`[F3] Exit Dev Mode`, 20, y);

        ctx.restore();
    }

    // Desenhar grid
    if (game.devMode.showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.lineWidth = 1;

        // Grid vertical (chunks)
        const startChunk = Math.floor(game.camera.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = startChunk + 5;

        for (let i = startChunk; i <= endChunk; i++) {
            const x = i * CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE - game.camera.x;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, game.height);
            ctx.stroke();

            // Número do chunk
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.font = '20px monospace';
            ctx.fillText(`Chunk ${i}`, x + 10, 30);
        }

        ctx.restore();
    }

    // Desenhar hitboxes
    if (game.devMode.showHitboxes) {
        ctx.save();
        ctx.lineWidth = 2;

        // Player hitbox
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(
            game.player.x - game.camera.x,
            game.player.y - game.camera.y,
            game.player.width,
            game.player.height
        );

        // Enemies hitboxes
        game.enemies.filter(e => e.alive).forEach(enemy => {
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(
                enemy.x - game.camera.x,
                enemy.y - game.camera.y,
                enemy.width,
                enemy.height
            );
        });

        // Coins hitboxes
        game.coins.filter(c => !c.collected).forEach(coin => {
            ctx.strokeStyle = '#ffff00';
            ctx.strokeRect(
                coin.x - game.camera.x,
                coin.y - game.camera.y,
                coin.width,
                coin.height
            );
        });

        // Powerups hitboxes
        game.powerups.filter(p => !p.collected).forEach(powerup => {
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(
                powerup.x - game.camera.x,
                powerup.y - game.camera.y,
                powerup.width,
                powerup.height
            );
        });

        // Platforms hitboxes
        game.chunks.forEach(chunk => {
            chunk.platforms.forEach(platform => {
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 0.3;
                ctx.strokeRect(
                    platform.x - game.camera.x,
                    platform.y - game.camera.y,
                    platform.width,
                    platform.height
                );
            });
        });

        ctx.restore();
    }
}
