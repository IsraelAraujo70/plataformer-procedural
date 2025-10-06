import { CONFIG } from '../config.js';
import { game } from '../game.js';
import { worldToIso, drawIsoShadow } from '../utils/Isometric.js';

// ============================================
// ENEMY BASE CLASS
// ============================================
export class Enemy {
    constructor(x, y, platformWidth, platformY, type = 'walker') {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE;
        this.vx = 1.5;
        this.vy = 0;
        this.platformX = x;
        this.platformWidth = platformWidth;
        this.platformY = platformY;
        this.alive = true;
        this.grounded = false;
        this.type = type;

        // Pontos por derrotar (pode ser modificado por subclasses)
        this.points = 50;

        // Cor padrão (pode ser modificado por subclasses)
        this.color = '#ff8800';
    }

    update() {
        if (!this.alive) return;

        // Colisão com Player 1
        if (this.intersects(game.player)) {
            this.handlePlayerCollision(game.player);
        }

        // Colisão com Player 2 (se existir)
        if (game.player2 && this.alive && this.intersects(game.player2)) {
            this.handlePlayerCollision(game.player2);
        }
    }

    handlePlayerCollision(player) {
        // Detectar stomp (jogador caindo sobre o inimigo)
        if (player.vy > CONFIG.STOMP_THRESHOLD &&
            player.y + player.height < this.y + this.height * 0.5) {
            this.alive = false;
            player.vy = CONFIG.JUMP_STRENGTH * 0.5; // Mini bounce

            // Adicionar pontos por derrotar inimigo
            player.score += this.points;
            game.stats.enemiesDefeated++;

            // createFloatingText e createParticles serão importados no main.js
            if (window.createFloatingText) {
                window.createFloatingText(`+${this.points}`, this.x + this.width / 2, this.y, '#ffff00');
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 8);
            }
        } else {
            // Jogador toma dano
            player.takeDamage();
        }
    }

    handlePlatformCollisions() {
        const startChunk = Math.floor((this.x - 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            chunk.platforms.forEach(platform => {
                if (this.intersectsPlatform(platform)) {
                    const overlapLeft = (this.x + this.width) - platform.x;
                    const overlapRight = (platform.x + platform.width) - this.x;
                    const overlapTop = (this.y + this.height) - platform.y;
                    const overlapBottom = (platform.y + platform.height) - this.y;

                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    // Colisão de cima (pousar na plataforma)
                    if (minOverlap === overlapTop && this.vy >= 0) {
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.grounded = true;
                    }
                }
            });
        }
    }

    intersectsPlatform(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }

    intersects(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    // Método para ser sobrescrito pelas subclasses
    draw(ctx) {
        // Implementação base - será sobrescrita
    }

    // Método auxiliar para desenhar inimigo em isométrico (para uso das subclasses)
    drawIsoEnemy(ctx, color, eyeColor = '#ff0000') {
        const worldX = this.x;
        const worldY = this.y;
        const worldZ = 0;

        // Converter para isométrico
        const isoPos = worldToIso(worldX, worldY, worldZ);
        const screenX = isoPos.isoX - game.camera.x;
        const screenY = isoPos.isoY - game.camera.y;

        // Sombra
        drawIsoShadow(ctx, worldX, worldY, 0, this.width, this.width);

        // Corpo do inimigo (esfera 3D simplificada)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, this.width / 2, this.width / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lado escuro (volume)
        const darkColor = this.darkenColor(color, 0.6);
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(screenX + 4, screenY + 4, this.width / 2.5, this.width / 4, 0, 0, Math.PI);
        ctx.fill();

        // Olhos (isométricos)
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(screenX - 6, screenY - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 2, screenY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX - 6, screenY - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 2, screenY - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);

        return `rgb(${newR}, ${newG}, ${newB})`;
    }
}
